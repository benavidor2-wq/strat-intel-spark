// CLAUDE_NOTE (data boundary) ============================================
//
// Purpose:
//   Single source-of-truth boundary between the UI and Supabase. Every
//   screen imports its data from THIS FILE. Nothing in `src/components`
//   or `src/pages` should call `supabase.from(...)` directly.
//
// Current wiring (Phase 2 — ingestion online):
//   - The analytical feed (`useReceipts`) reads the `receipts_full` VIEW,
//     which returns rows already shaped like the `Receipt` interface below
//     with `line_items` nested as jsonb and `custom_fields` folded to their
//     canonical labels. No client-side reshaping. Ever.
//   - `useUploads` powers the upload list; `useDatasetStats` / `useHasAnyData`
//     back the "MyCFO is waiting on data" empty states.
//   - `uploadInvoices` is the only write path. It hashes each file in the
//     browser, checks for a prior ingest of the same bytes, uploads to the
//     `raw-uploads` bucket at `${uid}/${yyyy}/${MM}/${uuid}.${ext}` (the
//     storage RLS policy keys off the first path segment — any other layout
//     is rejected), inserts an `uploads` row, and fire-and-forget invokes
//     `parse-upload`. The pg_cron sweeper covers a dropped invoke.
//   - Realtime subscriptions on `uploads` + `receipts` invalidate the
//     matching react-query keys so the UI updates on its own.
//
// Data contract (what Supabase feeds back through here):
//   The TypeScript interfaces below ARE the app-wide contract. When
//   deriving the pillar arrays (integrityAlerts, priceDriftItems, ...),
//   map fields 1:1 to these shapes. Widening a type is a breaking change.
//
// Math / owner:
//   Math contracts live in CLAUDE.md and inline `CLAUDE_NOTE` cookies in
//   `src/components/designs/Glassmorphism.tsx`. Pillar ownership per type:
//     - IntegrityAlert            -> Pillar A (Invoice Integrity)
//     - PriceDriftItem            -> Pillar B (Price Drift)
//     - ArbitrageOpportunity      -> Pillar C (Lazy Tax / Arbitrage)
//     - VendorConsolidation, vendorMonthlySpend, spendByCategory,
//       vendorProducts, categoryVendors -> Pillar D (Vendor Bloat)
//     - InventoryItem, spendingTrends   -> Pillar E (Operational Inertia)
//     - Receipt / LineItem              -> Raw ingestion (feeds A–E)
//     - CfoMessage                      -> MyCFO inbox output
//     - Notification, SavedModel        -> UI state (not analytical)
//
// Pillar derivations are DELIBERATELY still empty:
//   Deriving A/B/C/D/E from receipts is the next phase and I don't want it
//   guessed at now. The empty exports at the bottom stay empty until that
//   phase lands — the pillar pages already handle an empty state.
//
// =========================================================================

import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type DataBoundaryClient = {
  from: (relation: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

// The generated Cloud types are empty until the ingestion schema exists in the
// connected backend. Keep that looseness contained to this data boundary rather
// than editing auto-generated Supabase files or scattering casts in components.
const dataClient = supabase as unknown as DataBoundaryClient;

// ---- Pillar A: Invoice Integrity ----------------------------------------
export interface IntegrityAlert {
  id: string;
  type: "phantom_vendor" | "duplicate_invoice" | "split_invoice" | "mandate_fraud";
  severity: "critical" | "high" | "medium";
  vendor: string;
  amount: number;
  description: string;
  date: string;
}

// ---- Pillar B: Price Drift ----------------------------------------------
export interface PriceDriftInvoice {
  invoiceNo: string;
  date: string;
  unitPrice: number;
  qty: number;
  total: number;
}

export interface PriceDriftItem {
  id: string;
  product: string;
  vendor: string;
  currentPrice: number;
  avg90Day: number;
  driftPercent: number;
  status: "alert" | "warning" | "stable";
  recentInvoice: PriceDriftInvoice;
  historicalInvoices: PriceDriftInvoice[];
}

// ---- Pillar C: Lazy Tax / Arbitrage -------------------------------------
export interface ArbitrageOpportunity {
  id: string;
  product: string;
  vendors: {
    name: string;
    price: number;
    invoiceNo: string;
    invoiceDate: string;
    qty: number;
    total: number;
  }[];
  bestPrice: number;
  currentPrice: number;
  lazyTax: number;
  annualSavings: number;
  monthlyQty: number;
  unit: string;
  contractEnd: string;
  savingsPerUnit: number;
  monthlySavings: number;
}

// ---- Pillar D: Vendor Bloat --------------------------------------------
export interface VendorConsolidation {
  category: string;
  vendorCount: number;
  industryAvg: number;
  redundancyScore: number;
  potentialSavings: number;
}

export interface VendorMonthlySpend {
  vendor: string;
  monthlySpend: number;
}

export interface SpendByCategory {
  category: string;
  monthlySpend: number;
}

// ---- Pillar E: Operational Inertia --------------------------------------
export interface InventoryItem {
  id: string;
  product: string;
  burnRate: number;
  currentStock: number;
  daysRemaining: number;
  bulkDiscount: number;
  suggestedAction: string;
}

export interface SpendingTrend {
  period: string;
  revenue: number;
  costs: number;
  margin: number;
}

// ---- Raw ingestion (Receipts feed every pillar) --------------------------
export interface LineItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Receipt {
  id: string;
  merchant: string;
  date: string; // ISO YYYY-MM-DD
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  category: string;
  filename: string;
  line_items: LineItem[];
  custom_fields: Record<string, string>;
}

// ---- MyCFO output --------------------------------------------------------
export interface CfoMessage {
  id: string;
  subject: string;
  unread: boolean;
  spend_dna: string;
  top_impact_metric: string;
  health_score: number;
  created_at: string;
  summary: string;
  insights: string[];
}

// ---- UI-only shapes ------------------------------------------------------
export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface SavedModel {
  id: string;
  name: string;
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  rows: any[];
  cols: any[];
  filters: any[];
  chartType: string;
}

// =========================================================================
// Upload row shape (mirrors public.uploads)
// =========================================================================

export type UploadStatus = "queued" | "processing" | "complete" | "needs_review" | "failed";

export interface UploadRow {
  id: string;
  filename: string;
  mime_type: string;
  byte_size: number | null;
  status: UploadStatus;
  source: string;
  attempts: number;
  error_message: string | null;
  parser: string | null;
  confidence: number | null;
  page_count: number | null;
  receipt_id: string | null;
  receipt_count: number;
  created_at: string;
  processed_at: string | null;
}

export interface DatasetStats {
  receipt_count: number;
  total_spend: number;
  vendor_count: number;
  earliest_date: string | null;
  latest_date: string | null;
  last_updated: string | null;
  needs_review: number;
  duplicates: number;
}

// =========================================================================
// Hooks
// =========================================================================

const num = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v));
  return isFinite(n) ? n : 0;
};

// CLAUDE_NOTE (data)
// Purpose: analytical feed — every pillar and the Canvas read from here.
// Source:  view `public.receipts_full` (already shaped like `Receipt`,
//          `line_items` nested jsonb, `custom_fields` keys canonicalized).
// Filter:  `duplicate_of IS NULL` AND `date IS NOT NULL` (the view keeps
//          duplicates and undated rows so the review UI can see them, but
//          the analytical feed must not).
// RLS:     `user_id = auth.uid()`. Never called with service role.
// Cache:   staleTime Infinity — invalidation is driven by Realtime events
//          on `receipts` (see installRealtimeInvalidation below).
// Paging:  PostgREST enforces `db.max_rows` (1000 by default) on every
//          SELECT and returns the truncated page WITHOUT ERROR. For a
//          finance tool this is the worst failure mode possible — at 1001
//          receipts every chart would silently understate spend. We page
//          with `.range(from, to)` in blocks of PAGE_SIZE and stop when
//          a page comes back shorter than PAGE_SIZE.
const PAGE_SIZE = 1000;
export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    staleTime: Infinity,
    queryFn: async (): Promise<Receipt[]> => {
      const rows: any[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await dataClient
          .from("receipts_full")
          .select("*")
          .is("duplicate_of", null)
          .not("date", "is", null)
          .order("date", { ascending: false })
          .range(from, to);
        if (error) throw error;
        const page = data ?? [];
        rows.push(...page);
        if (page.length < PAGE_SIZE) break;
      }
      return rows.map((r: any) => ({
        id: r.id,
        merchant: r.merchant ?? "",
        date: r.date,
        subtotal: num(r.subtotal),
        tax: num(r.tax),
        total: num(r.total),
        currency: r.currency ?? "USD",
        category: r.category ?? "",
        filename: r.filename ?? "",
        custom_fields: r.custom_fields ?? {},
        line_items: (r.line_items ?? []).map((li: any) => ({
          name: li.name ?? "",
          quantity: num(li.quantity),
          unit_price: num(li.unit_price),
          total_price: num(li.total_price),
        })),
      }));
    },
  });
}

// CLAUDE_NOTE (data)
// Purpose: the Upload dialog's live list.
// Source:  table `public.uploads`, newest first, capped at 50.
// RLS:     `user_id = auth.uid()`.
// Cache:   staleTime 30s + Realtime invalidation on uploads.
export function useUploads(limit = 50) {
  return useQuery({
    queryKey: ["uploads", limit],
    staleTime: 30_000,
    queryFn: async (): Promise<UploadRow[]> => {
      const { data, error } = await dataClient
        .from("uploads")
        .select(
          "id, filename, mime_type, byte_size, status, source, attempts, error_message, parser, confidence, page_count, receipt_id, receipt_count, created_at, processed_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as UploadRow[];
    },
  });
}

// CLAUDE_NOTE (data)
// Purpose: cheap "has anything changed?" probe + empty-state check.
// Source:  RPC `public.dataset_stats()` — a few hundred bytes.
// RLS:     scoped to `auth.uid()` inside the function.
// Cache:   staleTime 60s + Realtime invalidation on receipts.
export function useDatasetStats() {
  return useQuery({
    queryKey: ["dataset_stats"],
    staleTime: 60_000,
    queryFn: async (): Promise<DatasetStats> => {
      const { data, error } = await dataClient.rpc("dataset_stats");
      if (error) throw error;
      const s: any = data ?? {};
      return {
        receipt_count: num(s.receipt_count),
        total_spend: num(s.total_spend),
        vendor_count: num(s.vendor_count),
        earliest_date: s.earliest_date ?? null,
        latest_date: s.latest_date ?? null,
        last_updated: s.last_updated ?? null,
        needs_review: num(s.needs_review),
        duplicates: num(s.duplicates),
      };
    },
  });
}

// CLAUDE_NOTE (data)
// Purpose: replaces the old `hasAnyData()` helper. Empty-state gate.
// Source:  useDatasetStats().data.receipt_count > 0.
export function useHasAnyData(): boolean {
  const { data } = useDatasetStats();
  return (data?.receipt_count ?? 0) > 0;
}

// =========================================================================
// Realtime — install once at app root
// =========================================================================

let realtimeInstalled = false;

// CLAUDE_NOTE (data)
// Purpose: keep the react-query cache honest without polling. `uploads`
//   flips queued -> processing -> complete/needs_review/failed on its own,
//   and `receipts` inserts drop into the Canvas / stats without a refresh.
// Debounce: `receipts` and `dataset_stats` are trailing-debounced ~1500ms
//   because `useReceipts` refetches the ENTIRE receipt history on every
//   invalidation. Dropping 50 invoices in one dialog fires ~50 INSERTs;
//   without debouncing that's 50 full re-downloads of the receipt table,
//   quadratically worse as the dataset grows. `uploads` stays snappy
//   (250ms) since it's a tiny query and drives the live status badges.
// Owner: infra glue.
const RECEIPTS_DEBOUNCE_MS = 1500;
const UPLOADS_DEBOUNCE_MS = 250;
let receiptsTimer: ReturnType<typeof setTimeout> | null = null;
let uploadsTimer: ReturnType<typeof setTimeout> | null = null;

export function installRealtimeInvalidation(qc: QueryClient) {
  if (realtimeInstalled) return;
  realtimeInstalled = true;

  const scheduleUploads = () => {
    if (uploadsTimer) clearTimeout(uploadsTimer);
    uploadsTimer = setTimeout(() => {
      uploadsTimer = null;
      qc.invalidateQueries({ queryKey: ["uploads"] });
    }, UPLOADS_DEBOUNCE_MS);
  };

  const scheduleReceipts = () => {
    if (receiptsTimer) clearTimeout(receiptsTimer);
    receiptsTimer = setTimeout(() => {
      receiptsTimer = null;
      qc.invalidateQueries({ queryKey: ["receipts"] });
      qc.invalidateQueries({ queryKey: ["dataset_stats"] });
    }, RECEIPTS_DEBOUNCE_MS);
  };

  supabase
    .channel("uploads-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "uploads" }, scheduleUploads)
    .subscribe();

  supabase
    .channel("receipts-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "receipts" }, scheduleReceipts)
    .subscribe();
}

/** Small hook that installs the realtime listener once. Clears any pending
 * debounce timers on teardown so an unmount doesn't leak a trailing fetch. */
export function useInstallRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    installRealtimeInvalidation(qc);
    return () => {
      if (receiptsTimer) { clearTimeout(receiptsTimer); receiptsTimer = null; }
      if (uploadsTimer)  { clearTimeout(uploadsTimer);  uploadsTimer  = null; }
    };
  }, [qc]);
}

// =========================================================================
// uploadInvoices — the ONLY write path into ingestion
// =========================================================================

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const ACCEPTED_UPLOAD_TYPES: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
};

export type UploadOutcome =
  | { file: string; status: "queued"; upload_id: string }
  | { file: string; status: "duplicate"; existing_upload_id: string; ingested_at: string }
  | { file: string; status: "rejected"; reason: string };

function fileExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function inferMime(file: File): string {
  if (file.type && ACCEPTED_UPLOAD_TYPES.includes(file.type)) return file.type;
  const ext = fileExt(file.name);
  return EXT_TO_MIME[ext] ?? file.type ?? "application/octet-stream";
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// CLAUDE_NOTE (data)
// Purpose: extract a human-readable string from anything a Supabase call
//   can throw. `PostgrestError` / `StorageError` / `FunctionsError` are
//   plain objects, not Error instances, so a bare `String(e)` yields
//   "[object Object]" and the UI shows garbage. Try known message-ish
//   fields in order, then fall back to JSON.
function errText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    for (const k of ["message", "error_description", "error", "hint", "details", "code"]) {
      const v = o[k];
      if (typeof v === "string" && v) return v;
    }
    try { return JSON.stringify(e); } catch { /* noop */ }
  }
  return String(e);
}

// CLAUDE_NOTE (data)
// Purpose: end-to-end ingestion write path — hash, dedupe, upload, insert,
//   fire-and-forget parse. Never writes to receipts/line_items directly;
//   only the `ingest_receipts` RPC (called from the edge function) does.
// Source of truth: uniqueness is enforced by uploads.content_sha256 (per
//   user). This function's pre-check just avoids paying storage + LLM for
//   an obvious duplicate; the 23505 branch handles the race.
// Progress: for large selections (folder uploads of hundreds/thousands),
//   the dialog needs live feedback. `onProgress` fires after each file with
//   the per-file outcome and a running (done/total) counter so the UI can
//   append rows and update a "Processed X of N" line without waiting for
//   the whole batch to finish.
// Owner: ingestion.
export type UploadProgress = (o: UploadOutcome, done: number, total: number) => void;

export async function uploadInvoices(
  files: File[],
  onProgress?: UploadProgress,
): Promise<UploadOutcome[]> {
  const total = files.length;
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    const results = files.map<UploadOutcome>((f) => ({ file: f.name, status: "rejected", reason: "Not signed in." }));
    results.forEach((r, i) => onProgress?.(r, i + 1, total));
    return results;
  }
  const uid = userRes.user.id;


  const results: UploadOutcome[] = [];
  const push = (o: UploadOutcome) => {
    results.push(o);
    onProgress?.(o, results.length, total);
  };

  for (const file of files) {
    try {
      const ext = fileExt(file.name);
      const mime = inferMime(file);
      if (!ACCEPTED_UPLOAD_TYPES.includes(mime)) {
        push({ file: file.name, status: "rejected", reason: `Unsupported file type (${mime || ext || "unknown"}).` });
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        push({ file: file.name, status: "rejected", reason: `File is larger than 50 MB.` });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const hash = await sha256Hex(bytes);

      // Dedupe pre-check — cheap and avoids wasting a storage write + LLM call.
      const { data: existing, error: dupErr } = await dataClient
        .from("uploads")
        .select("id, created_at")
        .eq("content_sha256", hash)
        .maybeSingle();
      if (dupErr && (dupErr as any).code !== "PGRST116") throw dupErr;
      if (existing) {
        push({
          file: file.name,
          status: "duplicate",
          existing_upload_id: (existing as any).id,
          ingested_at: (existing as any).created_at,
        });
        continue;
      }

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
      const objectName = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;
      const storagePath = `${uid}/${yyyy}/${mm}/${objectName}`;

      const { error: upErr } = await supabase.storage
        .from("raw-uploads")
        .upload(storagePath, file, { contentType: mime, upsert: false });
      if (upErr) throw upErr;

      const { data: inserted, error: insErr } = await dataClient
        .from("uploads")
        .insert({
          storage_path: storagePath,
          filename: file.name,
          mime_type: mime,
          byte_size: file.size,
          content_sha256: hash,
          source: "manual",
        })
        .select("id")
        .single();

      if (insErr) {
        if ((insErr as any).code === "23505") {
          await supabase.storage.from("raw-uploads").remove([storagePath]);
          const { data: prior } = await dataClient
            .from("uploads")
            .select("id, created_at")
            .eq("content_sha256", hash)
            .maybeSingle();
          push({
            file: file.name,
            status: "duplicate",
            existing_upload_id: (prior as any)?.id ?? "",
            ingested_at: (prior as any)?.created_at ?? new Date().toISOString(),
          });
          continue;
        }
        await supabase.storage.from("raw-uploads").remove([storagePath]);
        throw insErr;
      }

      const uploadId = (inserted as any).id as string;

      supabase.functions
        .invoke("parse-upload", { body: { upload_id: uploadId } })
        .catch((e) => {
          console.warn("parse-upload invoke failed (sweeper will retry):", errText(e));
        });

      push({ file: file.name, status: "queued", upload_id: uploadId });
    } catch (e) {
      push({ file: file.name, status: "rejected", reason: errText(e) });
    }
  }

  return results;
}


// CLAUDE_NOTE (data)
// Purpose: on-demand retry for a failed upload. Cheap because the RPC
//   caps attempts at 3 and reuses cached `extracted` — no re-billing.
export async function retryUpload(uploadId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("parse-upload", { body: { upload_id: uploadId } });
  if (error) throw error;
}

// =========================================================================
// EMPTY EXPORTS — pillar derivations, deliberately unwired.
// Deriving A/B/C/D/E from receipts is the next phase. The pillar pages
// already handle an empty state.
// =========================================================================

export const integrityAlerts: IntegrityAlert[] = [];
export const priceDriftItems: PriceDriftItem[] = [];
export const arbitrageOpportunities: ArbitrageOpportunity[] = [];
export const inventoryItems: InventoryItem[] = [];
export const spendingTrends: SpendingTrend[] = [];
export const vendorConsolidation: VendorConsolidation[] = [];
export const spendByCategory: SpendByCategory[] = [];
export const vendorMonthlySpend: VendorMonthlySpend[] = [];

export const summaryStats = {
  totalAnomalies: 0,
  criticalAlerts: 0,
  totalLazyTax: 0,
  inflationLeaks: 0,
  vendorBloatScore: 0,
  marginErosion: 0,
  totalPotentialSavings: 0,
  activeVendors: 0,
  industryAvgVendors: 0,
};

export const vendorProducts: Record<
  string,
  {
    products: string[];
    category: string;
    recentInvoices: { invoiceNo: string; date: string; product: string; amount: number; qty: number }[];
  }
> = {};

export const categoryVendors: Record<
  string,
  { vendors: { name: string; spend: number }[]; description: string }
> = {};

export const cfoMessages: CfoMessage[] = [];
export const savedModels: SavedModel[] = [];
export const notifications: Notification[] = [];

// =========================================================================
// Projects — derived client-side from receipts' custom_fields
// =========================================================================
// CLAUDE_NOTE (data)
// Purpose: power the Projects tab. A "project" is any value found in a
//   receipt's custom_fields under one of the recognized project-like keys.
// Source:  cached useReceipts() output (no extra network).
// Owner:   Projects tab UI.
const PROJECT_KEYS = ["job site", "project", "job code", "po number"];

function receiptProjectValues(r: Receipt): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(r.custom_fields || {})) {
    if (v == null) continue;
    const val = String(v).trim();
    if (!val) continue;
    if (PROJECT_KEYS.includes(k.toLowerCase().trim())) out.push(val);
  }
  return out;
}

export interface ProjectSummary {
  value: string;
  key: string;
  receiptCount: number;
  totalSpend: number;
}

export function useProjects() {
  const { data: receipts = [], isLoading } = useReceipts();
  const map = new Map<string, ProjectSummary>();
  for (const r of receipts) {
    const seen = new Set<string>();
    for (const raw of receiptProjectValues(r)) {
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = map.get(key);
      if (existing) {
        existing.receiptCount += 1;
        existing.totalSpend += r.total || 0;
      } else {
        map.set(key, { value: raw, key, receiptCount: 1, totalSpend: r.total || 0 });
      }
    }
  }
  const projects = [...map.values()].sort((a, b) => a.value.localeCompare(b.value));
  return { projects, isLoading };
}

export interface ProjectLineRow {
  receiptId: string;
  date: string;
  vendor: string;
  invoiceNo: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ProjectDetail {
  receipts: Receipt[];
  lineItems: ProjectLineRow[];
  totalsByVendor: { vendor: string; total: number; lineCount: number }[];
  grandTotal: number;
  lineCount: number;
  dateRange: { start: string | null; end: string | null };
}

export function useProjectDetail(projectKey: string | null): ProjectDetail | null {
  const { data: receipts = [] } = useReceipts();
  if (!projectKey) return null;
  const matched = receipts.filter((r) =>
    receiptProjectValues(r).some((v) => v.toLowerCase() === projectKey),
  );
  const lineItems: ProjectLineRow[] = [];
  const vendorMap = new Map<string, { total: number; lineCount: number }>();
  let grandTotal = 0;
  let start: string | null = null;
  let end: string | null = null;
  for (const r of matched) {
    grandTotal += r.total || 0;
    if (r.date) {
      if (!start || r.date < start) start = r.date;
      if (!end || r.date > end) end = r.date;
    }
    const vendor = r.merchant || "Unknown vendor";
    const invoiceNo = (r as any).invoice_no ?? "";
    for (const li of r.line_items || []) {
      lineItems.push({
        receiptId: r.id,
        date: r.date,
        vendor,
        invoiceNo,
        name: li.name,
        quantity: li.quantity,
        unit_price: li.unit_price,
        total_price: li.total_price,
      });
      const v = vendorMap.get(vendor) ?? { total: 0, lineCount: 0 };
      v.total += li.total_price || 0;
      v.lineCount += 1;
      vendorMap.set(vendor, v);
    }
  }
  const totalsByVendor = [...vendorMap.entries()]
    .map(([vendor, v]) => ({ vendor, total: v.total, lineCount: v.lineCount }))
    .sort((a, b) => b.total - a.total);
  return {
    receipts: matched,
    lineItems,
    totalsByVendor,
    grandTotal,
    lineCount: lineItems.length,
    dateRange: { start, end },
  };
}
