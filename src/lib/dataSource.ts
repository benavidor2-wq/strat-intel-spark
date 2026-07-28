// CLAUDE_NOTE (data boundary) ============================================
//
// Purpose:
//   Single source-of-truth boundary between the UI and the backend.
//   Every screen imports its data from THIS FILE. Nothing in `src/components`
//   or `src/pages` should import from `@/data/*` — those files no longer
//   exist. If you need seed data, wire it here (from Supabase), not inline.
//
// Current state (as handed off to Claude Code):
//   All exports return EMPTY arrays / zero-valued summaries. The app renders
//   empty-state placeholders everywhere until real ingestion is wired.
//
// Data contract (what Supabase must eventually feed back through here):
//   The TypeScript types below ARE the contract. When you build the schema,
//   map columns 1:1 to these fields, then replace the empty exports with
//   async fetchers that hit Supabase (see "How to wire this" below).
//
// Math / owner:
//   Math contracts live in CLAUDE.md and inline `CLAUDE_NOTE` cookies inside
//   `src/components/designs/Glassmorphism.tsx`. Pillar ownership per type:
//     - IntegrityAlert            -> Pillar A (Invoice Integrity)
//     - PriceDriftItem            -> Pillar B (Price Drift)
//     - ArbitrageOpportunity      -> Pillar C (Lazy Tax / Arbitrage)
//     - VendorConsolidation, vendorMonthlySpend, spendByCategory,
//       vendorProducts, categoryVendors -> Pillar D (Vendor Bloat)
//     - InventoryItem, spendingTrends   -> Pillar E (Operational Inertia)
//     - Receipt / LineItem              -> Raw ingestion (feeds A-E)
//     - CfoMessage                      -> MyCFO inbox output
//     - Notification, SavedModel        -> UI state (not analytical)
//
// How to wire this (Claude Code — do this once the Supabase schema exists):
//   1. Turn each `export const foo: Foo[] = []` into an async function or
//      React hook (e.g. `useIntegrityAlerts()`) backed by Supabase.
//   2. Add `CLAUDE_NOTE (data)` cookies at each new call site describing the
//      table, RLS assumption, and cache/refresh policy.
//   3. Keep the type definitions in this file — they are the contract every
//      consumer relies on. Widening a type is a breaking change; document it
//      in `CLAUDE.md` and update the pillar's math contract if math shifts.
//
// =========================================================================

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
// EMPTY EXPORTS
// Replace each of these with Supabase-backed fetchers when the schema lands.
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

export const receipts: Receipt[] = [];
export const cfoMessages: CfoMessage[] = [];
export const savedModels: SavedModel[] = [];
export const notifications: Notification[] = [];

// Convenience: true when nothing has been ingested yet. Components use this
// to decide whether to render their normal UI or an empty-state placeholder.
export const hasAnyData = (): boolean =>
  receipts.length > 0 ||
  integrityAlerts.length > 0 ||
  priceDriftItems.length > 0 ||
  arbitrageOpportunities.length > 0 ||
  vendorMonthlySpend.length > 0 ||
  spendByCategory.length > 0;
