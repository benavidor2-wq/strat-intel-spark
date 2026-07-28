// Shared parse-and-ingest pipeline for parse-upload and sweep-uploads.
// The DB (see CLAUDE.md contract) owns all writes via ingest_receipts.
// We only: download the file, produce the receipts JSON, call the RPC.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";
import mammoth from "npm:mammoth@1.8.0";
import * as XLSX from "npm:xlsx@0.18.5";
import { Buffer } from "node:buffer";

// Sentinel error class for LLM budget/rate failures so the UI can show
// "AI credits exhausted" instead of a raw provider dump.
class LlmBudgetError extends Error {
  constructor(public readonly kind: "credits_exhausted" | "rate_limited", message: string) {
    super(message);
    this.name = "LlmBudgetError";
  }
}

export const CATEGORIES = [
  "Materials", "Tools & Equipment", "Subcontractors", "Professional Services",
  "Software & Subscriptions", "Utilities", "Rent & Facilities", "Insurance",
  "Vehicle & Fuel", "Freight & Shipping", "Office Supplies",
  "Marketing & Advertising", "Travel & Meals", "Payroll & Benefits",
  "Taxes & Fees", "Repairs & Maintenance", "Other",
] as const;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const LLM_MODEL = "gemini-3.6-flash";
const LLM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent`; // uses native Gemini parts
const LOVABLE_AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions"; // kept as reference only

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// ------ JSON schema for the LLM ---------------------------------------------

const receiptsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["receipts", "confidence"],
  properties: {
    confidence: { type: "number" },
    receipts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "merchant", "invoice_no", "date", "subtotal", "tax", "total",
          "currency", "category", "custom_fields", "line_items",
        ],
        properties: {
          merchant: { type: ["string", "null"] },
          invoice_no: { type: ["string", "null"] },
          date: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
          subtotal: { type: ["number", "null"] },
          tax: { type: ["number", "null"] },
          total: { type: ["number", "null"] },
          currency: { type: ["string", "null"] },
          category: { type: ["string", "null"], enum: [...CATEGORIES, null] },
          custom_fields: { type: "object", additionalProperties: { type: ["string", "number", "null"] } },
          line_items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "sku", "uom", "quantity", "unit_price", "total_price"],
              properties: {
                name: { type: "string" },
                sku: { type: ["string", "null"] },
                uom: { type: ["string", "null"] },
                quantity: { type: ["number", "null"] },
                unit_price: { type: ["number", "null"] },
                total_price: { type: ["number", "null"] },
              },
            },
          },
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You extract structured invoice/receipt data from documents.

HARD RULES:
- NEVER invent a value. If the document does not clearly show a field (date, subtotal, tax, invoice number, etc.), return null. A guessed date silently corrupts every downstream trend chart — a null that gets flagged for review is strictly better than a plausible fabrication.
- Dates MUST be YYYY-MM-DD or null. Do not guess year.
- Extract EVERY line item, including discounts, freight, shipping, and fees. Return discounts/credits/rebates as NEGATIVE numbers. Do not skip them.
- If the document contains multiple invoices, return one object per invoice in "receipts".
- "category" MUST be one of the allowed enum values, or null if unclear.
- "custom_fields": include business identifiers when the document shows them — PO Number, Project, Work Order, Job Code, Department, Payment Terms, Contract Number. Use whatever label the document uses as the key; omit anything absent.
- Do not round or reformat numbers unnecessarily; return them as numbers (e.g. 1234.56, not "$1,234.56").
- "confidence" is your own 0..1 certainty about the overall extraction.`;

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }
  | { file_data: { mime_type: string; file_uri: string } };

function normalizeGeminiParts(userContent: unknown): GeminiPart[] {
  // Text-only path: a plain string.
  if (typeof userContent === "string") {
    return [{ text: userContent }];
  }

  // OpenAI-style message array produced by the format parsers.
  if (!Array.isArray(userContent)) return [{ text: String(userContent) }];

  const parts: GeminiPart[] = [];
  for (const item of userContent) {
    if (typeof item !== "object" || item === null) continue;
    const type = (item as any).type;
    if (type === "text") {
      parts.push({ text: String((item as any).text ?? "") });
    } else if (type === "image_url") {
      const url = String((item as any).image_url?.url ?? "");
      const m = url.match(/^data:([^;]+);base64,(.+)$/);
      if (m) {
        parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
      } else {
        parts.push({ text: `[Image URL not inline: ${url}]` });
      }
    } else if (type === "file_ref" || type === "file") {
      const file = (item as any).file;
      const file_uri = (item as any).file_uri ?? file?.file_data;
      const mime_type = (item as any).mime_type ?? file?.mime_type ?? "application/pdf";
      if (file_uri && file_uri.startsWith("http")) {
        parts.push({ file_data: { mime_type, file_uri } });
      } else {
        parts.push({ text: `[File attachment not inline: ${file?.filename ?? ""}]` });
      }
    } else {
      parts.push({ text: String(item) });
    }
  }
  return parts;
}

async function uploadGeminiFile(bytes: Uint8Array, mime: string, displayName: string): Promise<string> {
  const boundary = "----InvoiciifyGeminiBoundary";
  const metadata = JSON.stringify({ file: { display_name: displayName } });
  const encoder = new TextEncoder();
  const body = new Uint8Array([
    ...encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${metadata}\r\n`),
    ...encoder.encode(`--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`),
    ...bytes,
    ...encoder.encode(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "X-Goog-Upload-Protocol": "multipart", "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  if (!uploadRes.ok) {
    throw new Error(`Gemini file upload ${uploadRes.status}: ${await uploadRes.text()}`);
  }
  const uploadJson = await uploadRes.json();
  const name = uploadJson.file?.name;
  const fileUri = uploadJson.file?.uri;
  if (!fileUri) throw new Error("Gemini file upload did not return a URI");

  // Poll until the file is active (usually immediate, but not guaranteed).
  for (let i = 0; i < 15; i++) {
    const statusRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/files/${name}?key=${GEMINI_API_KEY}`,
    );
    if (statusRes.ok) {
      const statusJson = await statusRes.json();
      if (statusJson.state === "ACTIVE") return fileUri;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return fileUri; // proceed anyway; model will error if still processing
}

async function callLLM(
  userContent: unknown,
  { timeoutMs = 120_000 }: { timeoutMs?: number } = {},
): Promise<{ parsed: any; raw: any }> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const parts = normalizeGeminiParts(userContent);
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: receiptsSchema,
      },
    };

    const res = await fetch(`${LLM_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new LlmBudgetError("rate_limited", "Gemini API rate limit hit — wait a minute and retry.");
      if (res.status === 400 && text.includes("API key not valid")) throw new Error(`Gemini API key invalid: ${text.slice(0, 200)}`);
      throw new Error(`LLM ${res.status}: ${text.slice(0, 500)}`);
    }

    const raw = await res.json();
    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let parsed: any;
    try {
      parsed = typeof text === "string" ? JSON.parse(text) : text;
    } catch {
      const m = String(text).match(/\{[\s\S]*\}$/);
      parsed = m ? JSON.parse(m[0]) : { receipts: [], confidence: 0 };
    }
    return { parsed, raw };
  } finally {
    clearTimeout(to);
  }
}

async function callLLMWithFile(
  bytes: Uint8Array,
  mime: string,
  displayName: string,
  prompt: string,
): Promise<{ parsed: any; raw: any }> {
  const fileUri = await uploadGeminiFile(bytes, mime, displayName);
  return callLLM([
    { type: "text", text: prompt },
    { type: "file_ref", mime_type: mime, file_uri: fileUri },
  ]);
}

// ------ Format-specific parsers ---------------------------------------------

type ParseResult = {
  receipts: any[];
  parser: string;
  confidence: number | null;
  extracted: any;
  page_count: number | null;
};

async function parsePdf(bytes: Uint8Array): Promise<ParseResult> {
  let pageCount: number | null = null;
  let text = "";
  try {
    const pdf = await getDocumentProxy(bytes);
    pageCount = pdf.numPages ?? null;
    const out = await extractText(pdf, { mergePages: true });
    text = Array.isArray(out.text) ? out.text.join("\n") : String(out.text ?? "");
  } catch (_) {
    text = "";
  }
  const stripped = text.replace(/\s+/g, "");
  if (stripped.length >= 200) {
    const { parsed, raw } = await callLLM(
      `Extract all invoices from this PDF text:\n\n${text.slice(0, 200_000)}`,
    );
    return {
      receipts: parsed.receipts ?? [],
      parser: "pdf-text",
      confidence: parsed.confidence ?? null,
      extracted: raw,
      page_count: pageCount,
    };
  }
  // Fallback: send the PDF itself to the multimodal model via Gemini Files API.
  const { parsed, raw } = await callLLMWithFile(
    bytes,
    "application/pdf",
    "invoice.pdf",
    "Extract all invoices from this PDF. If you cannot read it, return empty receipts and confidence 0.",
  );
  return {
    receipts: parsed.receipts ?? [],
    parser: "pdf-vision",
    confidence: parsed.confidence ?? null,
    extracted: raw,
    page_count: pageCount,
  };
}

async function parseImage(bytes: Uint8Array, mime: string): Promise<ParseResult> {
  const b64 = base64Encode(bytes);
  const { parsed, raw } = await callLLM([
    { type: "text", text: "Extract all invoices/receipts visible in this image." },
    { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
  ]);
  return {
    receipts: parsed.receipts ?? [],
    parser: "image-vision",
    confidence: parsed.confidence ?? null,
    extracted: raw,
    page_count: null,
  };
}

async function parseDocx(bytes: Uint8Array): Promise<ParseResult> {
  // mammoth expects a Node Buffer under Deno's npm compat; a raw Uint8Array
  // throws "Can't find end of central directory".
  const { value: text } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  const { parsed, raw } = await callLLM(
    `Extract all invoices from this Word document text:\n\n${text.slice(0, 200_000)}`,
  );
  return {
    receipts: parsed.receipts ?? [],
    parser: "docx",
    confidence: parsed.confidence ?? null,
    extracted: raw,
    page_count: null,
  };
}

// ---- XLSX / CSV -----------------------------------------------------------

const HEADER_ALIASES: Record<string, string[]> = {
  vendor: ["vendor", "supplier", "merchant", "payee", "company", "vendor name", "supplier name"],
  date: ["date", "invoice date", "txn date", "transaction date", "posted date"],
  invoice_no: ["invoice", "invoice no", "invoice #", "invoice number", "ref", "reference", "ref no", "document"],
  name: ["description", "item", "product", "line item", "details", "service"],
  sku: ["sku", "part", "part no", "part number", "code", "item code"],
  uom: ["uom", "unit", "units"],
  quantity: ["qty", "quantity", "units"],
  unit_price: ["unit price", "price", "rate", "unit cost"],
  total_price: ["amount", "total", "line total", "extended", "extended price", "subtotal"],
  tax: ["tax", "vat", "gst", "hst", "sales tax"],
  invoice_total: ["invoice total", "grand total", "total due", "amount due", "balance due"],
  currency: ["currency", "curr"],
  category: ["category", "class", "type"],
};

function normHeader(h: string): string {
  return h.toString().trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}

function detectColumns(headers: string[]): Record<string, number> | null {
  const map: Record<string, number> = {};
  const norm = headers.map(normHeader);
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = norm.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[key] = idx;
  }
  // Need enough signal that this is really a tabular invoice sheet.
  const hasAmount = "total_price" in map || "unit_price" in map || "invoice_total" in map;
  const hasName = "name" in map || "vendor" in map;
  if (!hasAmount || !hasName) return null;
  return map;
}

function toNum(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v).trim();
  const neg = /^\s*[(-]/.test(s);
  const d = s.replace(/[^0-9.]/g, "");
  if (!d) return null;
  const n = parseFloat(d);
  if (!isFinite(n)) return null;
  return neg ? -n : n;
}

function toDate(v: any): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !isNaN(+v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      const iso = new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString().slice(0, 10);
      return iso;
    }
  }
  const s = String(v).trim();
  const t = Date.parse(s);
  if (!isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return null;
}

function deterministicFromRows(rows: any[][]): any[] | null {
  // Find header row within first ~10 rows.
  let headerIdx = -1;
  let cols: Record<string, number> | null = null;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i]?.map((c) => (c == null ? "" : String(c)));
    if (!r || r.length < 2) continue;
    const detected = detectColumns(r);
    if (detected) { headerIdx = i; cols = detected; break; }
  }
  if (headerIdx < 0 || !cols) return null;

  const groups = new Map<string, any>();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every((c) => c == null || c === "")) continue;
    const cell = (k: string) => (cols![k] != null ? r[cols![k]] : undefined);

    const vendor = cell("vendor") ? String(cell("vendor")).trim() : null;
    const date = toDate(cell("date"));
    const inv = cell("invoice_no") ? String(cell("invoice_no")).trim() : null;
    const key = (inv || `${vendor ?? "?"}|${date ?? "?"}`);

    let g = groups.get(key);
    if (!g) {
      g = {
        merchant: vendor,
        invoice_no: inv,
        date,
        subtotal: null,
        tax: toNum(cell("tax")),
        total: toNum(cell("invoice_total")),
        currency: cell("currency") ? String(cell("currency")).trim().toUpperCase() : null,
        category: cell("category") ? String(cell("category")).trim() : null,
        custom_fields: {},
        line_items: [] as any[],
      };
      groups.set(key, g);
    } else {
      // Fill in blanks from later rows of same group.
      g.merchant ??= vendor;
      g.date ??= date;
      g.tax ??= toNum(cell("tax"));
      g.total ??= toNum(cell("invoice_total"));
    }

    const name = cell("name");
    if (name != null && String(name).trim() !== "") {
      const qty = toNum(cell("quantity"));
      const unit = toNum(cell("unit_price"));
      const tot = toNum(cell("total_price"));
      g.line_items.push({
        name: String(name).trim(),
        sku: cell("sku") ? String(cell("sku")).trim() : null,
        uom: cell("uom") ? String(cell("uom")).trim() : null,
        quantity: qty,
        unit_price: unit,
        total_price: tot,
      });
    }
  }

  const receipts = [...groups.values()].filter(
    (g) => g.line_items.length > 0 || g.total != null,
  );
  return receipts.length > 0 ? receipts : null;
}

async function parseSpreadsheet(bytes: Uint8Array, mime: string): Promise<ParseResult> {
  const wb = XLSX.read(bytes, { type: "array", cellDates: true });
  const allRows: any[][] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null }) as any[][];
    allRows.push(...rows);
    allRows.push([]); // blank separator between sheets
  }

  const deterministic = deterministicFromRows(allRows);
  if (deterministic && deterministic.length > 0) {
    return {
      receipts: deterministic,
      parser: "xlsx-deterministic",
      confidence: 0.95,
      extracted: { mode: "deterministic", sheet_count: wb.SheetNames.length, receipt_count: deterministic.length },
      page_count: wb.SheetNames.length,
    };
  }

  // Fall back to LLM on the CSV projection.
  const csvParts: string[] = [];
  for (const name of wb.SheetNames) {
    csvParts.push(`# Sheet: ${name}\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`);
  }
  const csv = csvParts.join("\n\n").slice(0, 200_000);
  const { parsed, raw } = await callLLM(
    `Extract all invoices from this spreadsheet (as CSV). One spreadsheet often contains many invoices — group rows by invoice number, or by vendor+date if there is no invoice number. Return one receipt per group.\n\n${csv}`,
  );
  return {
    receipts: parsed.receipts ?? [],
    parser: mime === "text/csv" ? "csv-llm" : "xlsx-llm",
    confidence: parsed.confidence ?? null,
    extracted: raw,
    page_count: wb.SheetNames.length,
  };
}

// ------ Helpers -------------------------------------------------------------

function base64Encode(bytes: Uint8Array): string {
  // Small chunks — spreading ~32k args into fromCharCode overflows the call
  // stack on multi-page scans. 8k stays comfortably under every runtime's cap.
  let s = "";
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

async function dispatchParse(
  bytes: Uint8Array,
  mime: string,
  filename: string,
): Promise<ParseResult> {
  const m = (mime || "").toLowerCase();
  const name = (filename || "").toLowerCase();

  if (m === "application/pdf" || name.endsWith(".pdf")) return parsePdf(bytes);
  if (m.startsWith("image/")) return parseImage(bytes, m || "image/jpeg");
  if (
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) return parseDocx(bytes);
  if (
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    m === "application/vnd.ms-excel" ||
    m === "text/csv" ||
    name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")
  ) return parseSpreadsheet(bytes, m || "application/vnd.ms-excel");

  throw new Error(`unsupported mime type: ${mime || "unknown"} (${filename})`);
}

// ------ Orchestration -------------------------------------------------------

export type ClaimedUpload = {
  id: string;
  user_id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  byte_size: number | null;
  source: string;
  attempts: number;
  extracted: any;
};

export async function processClaimed(
  sb: SupabaseClient,
  job: ClaimedUpload,
): Promise<{ upload_id: string; ok: boolean; error?: string; result?: any }> {
  try {
    let parseResult: ParseResult;

    if (job.extracted && (job.extracted.receipts || job.extracted.mode)) {
      // Re-use prior extraction: never re-pay OCR/LLM on retry.
      const cached = job.extracted;
      if (cached.mode === "deterministic") {
        // Deterministic cache doesn't include the receipts array; re-download and re-parse deterministically.
        // (Deterministic is free/fast.)
        const { data: file, error: dlErr } = await sb.storage.from("raw-uploads").download(job.storage_path);
        if (dlErr || !file) throw new Error(`download failed: ${dlErr?.message ?? "no file"}`);
        const bytes = new Uint8Array(await file.arrayBuffer());
        parseResult = await dispatchParse(bytes, job.mime_type, job.filename);
      } else {
        const text = cached?.choices?.[0]?.message?.content ?? "";
        let parsed: any = { receipts: [], confidence: null };
        try { parsed = typeof text === "string" ? JSON.parse(text) : text; } catch { /* keep default */ }
        parseResult = {
          receipts: parsed.receipts ?? [],
          parser: "cached",
          confidence: parsed.confidence ?? null,
          extracted: cached,
          page_count: null,
        };
      }
    } else {
      const { data: file, error: dlErr } = await sb.storage.from("raw-uploads").download(job.storage_path);
      if (dlErr || !file) throw new Error(`download failed: ${dlErr?.message ?? "no file"}`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      parseResult = await dispatchParse(bytes, job.mime_type, job.filename);
    }

    const { data: ingest, error: ingErr } = await sb.rpc("ingest_receipts", {
      p_upload_id: job.id,
      p_receipts: parseResult.receipts,
      p_parser: parseResult.parser,
      p_confidence: parseResult.confidence,
      p_extracted: parseResult.extracted,
      p_page_count: parseResult.page_count,
    });
    if (ingErr) throw new Error(`ingest_receipts: ${ingErr.message}`);
    return { upload_id: job.id, ok: true, result: ingest };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sb.rpc("fail_upload", { p_upload_id: job.id, p_error: msg });
    return { upload_id: job.id, ok: false, error: msg };
  }
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
