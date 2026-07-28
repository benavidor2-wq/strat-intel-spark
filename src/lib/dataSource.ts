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
export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    staleTime: Infinity,
    queryFn: async (): Promise<Receipt[]> => {
      const { data, error } = await supabase
        .from("receipts_full" as any)
        .select("*")
        .is("duplicate_of", null)
        .not("date", "is", null)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase.rpc("dataset_stats");
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
// Owner: infra glue.
export function installRealtimeInvalidation(qc: QueryClient) {
  if (realtimeInstalled) return;
  realtimeInstalled = true;

  supabase
    .channel("uploads-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "uploads" }, () => {
      qc.invalidateQueries({ queryKey: ["uploads"] });
    })
    .subscribe();

  supabase
    .channel("receipts-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "receipts" }, () => {
      qc.invalidateQueries({ queryKey: ["receipts"] });
      qc.invalidateQueries({ queryKey: ["dataset_stats"] });
    })
    .subscribe();
}

/** Small hook that installs the realtime listener once. */
export function useInstallRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    installRealtimeInvalidation(qc);
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
// Purpose: end-to-end ingestion write path — hash, dedupe, upload, insert,
//   fire-and-forget parse. Never writes to receipts/line_items directly;
//   only the `ingest_receipts` RPC (called from the edge function) does.
// Source of truth: uniqueness is enforced by uploads.content_sha256 (per
//   user). This function's pre-check just avoids paying storage + LLM for
//   an obvious duplicate; the 23505 branch handles the race.
// Owner: ingestion.
export async function uploadInvoices(files: File[]): Promise<UploadOutcome[]> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return files.map((f) => ({ file: f.name, status: "rejected", reason: "Not signed in." }));
  }
  const uid = userRes.user.id;

  const results: UploadOutcome[] = [];

  for (const file of files) {
    try {
      const ext = fileExt(file.name);
      const mime = inferMime(file);
      if (!ACCEPTED_UPLOAD_TYPES.includes(mime)) {
        results.push({ file: file.name, status: "rejected", reason: `Unsupported file type (${mime || ext || "unknown"}).` });
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        results.push({ file: file.name, status: "rejected", reason: `File is larger than 50 MB.` });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const hash = await sha256Hex(bytes);

      // Dedupe pre-check — cheap and avoids wasting a storage write + LLM call.
      const { data: existing, error: dupErr } = await supabase
        .from("uploads")
        .select("id, created_at")
        .eq("content_sha256", hash)
        .maybeSingle();
      if (dupErr && dupErr.code !== "PGRST116") throw dupErr;
      if (existing) {
        results.push({
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

      const { data: inserted, error: insErr } = await supabase
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
        // Race on the unique (user_id, content_sha256) constraint — someone
        // (another tab, the sweeper's ghost) just wrote the same file.
        // Delete the orphan we just uploaded so the bucket doesn't leak.
        if ((insErr as any).code === "23505") {
          await supabase.storage.from("raw-uploads").remove([storagePath]);
          const { data: prior } = await supabase
            .from("uploads")
            .select("id, created_at")
            .eq("content_sha256", hash)
            .maybeSingle();
          results.push({
            file: file.name,
            status: "duplicate",
            existing_upload_id: (prior as any)?.id ?? "",
            ingested_at: (prior as any)?.created_at ?? new Date().toISOString(),
          });
          continue;
        }
        // Any other insert failure: clean up the object.
        await supabase.storage.from("raw-uploads").remove([storagePath]);
        throw insErr;
      }

      const uploadId = (inserted as any).id as string;

      // Fire-and-forget the parser. The pg_cron sweeper (every 2 min) covers
      // a dropped invoke, so we don't await — the UI advances via Realtime
      // on the uploads row.
      supabase.functions
        .invoke("parse-upload", { body: { upload_id: uploadId } })
        .catch((e) => {
          // Non-fatal — the sweeper will pick it up. Log for diagnosis.
          console.warn("parse-upload invoke failed (sweeper will retry):", e);
        });

      results.push({ file: file.name, status: "queued", upload_id: uploadId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ file: file.name, status: "rejected", reason: msg });
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
