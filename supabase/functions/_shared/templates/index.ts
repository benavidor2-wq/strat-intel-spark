// Vendor-specific deterministic parser registry.
//
// Each template exposes `detect(text)` and `parse(text)`. Templates run BEFORE
// the LLM on native-text PDFs; if a template matches but its output fails
// validation, we discard the result and fall back to the LLM path. A silently
// mis-parsed template is worse than an LLM call.

// Templates are intentionally EMPTY. The White Cap template was removed because
// `unpdf` extracts these PDFs as a flat run-on string rather than the
// newline-separated columns the template needed — the LLM path handles them
// correctly. The registry + validate-or-fallback machinery below stays in
// place so future deterministic vendor parsers can be added in one line.

export interface VendorTemplate {
  name: string;
  detect: (text: string) => boolean;
  parse: (text: string) => any[];
}

export const TEMPLATES: VendorTemplate[] = [];

// Reconciliation tolerance: line-sum vs invoice total.
const RECON_ABS = 5.0;    // $5
const RECON_PCT = 0.02;   // 2%

/**
 * Validate a set of receipts against basic arithmetic. Returns true if
 * every receipt looks internally consistent enough to trust.
 *
 * We only require:
 *  - at least one line item
 *  - every line: quantity * unit_price ≈ total_price (when all present)
 *  - sum(line total_price) ≈ (subtotal or total) within tolerance
 */
export function validateReceipts(receipts: any[]): boolean {
  if (!receipts || receipts.length === 0) return false;
  for (const r of receipts) {
    const lines: any[] = Array.isArray(r?.line_items) ? r.line_items : [];
    if (lines.length === 0) return false;

    let lineSum = 0;
    let sumUsable = true;
    for (const l of lines) {
      const q = numOrNull(l?.quantity);
      const u = numOrNull(l?.unit_price);
      const t = numOrNull(l?.total_price);
      // Per-line arithmetic check when all three are present.
      if (q != null && u != null && t != null) {
        const expected = q * u;
        const tol = Math.max(0.02, Math.abs(expected) * 0.02);
        if (Math.abs(expected - t) > tol) return false;
      }
      if (t == null) sumUsable = false;
      else lineSum += t;
    }

    const anchor = numOrNull(r?.subtotal) ?? numOrNull(r?.total);
    if (sumUsable && anchor != null && anchor !== 0) {
      const tol = Math.max(RECON_ABS, Math.abs(anchor) * RECON_PCT);
      if (Math.abs(lineSum - anchor) > tol) return false;
    }
  }
  return true;
}

function numOrNull(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isFinite(n) ? n : null;
}

/**
 * Try templates in order. Returns { receipts, template } on success, or null
 * if no template matched OR the matched template's output failed validation.
 */
export function tryTemplates(text: string): { receipts: any[]; template: string } | null {
  if (!text || text.length < 50) return null;
  for (const tpl of TEMPLATES) {
    let matched = false;
    try {
      matched = tpl.detect(text);
    } catch { /* ignore detect errors */ }
    if (!matched) continue;
    try {
      const receipts = tpl.parse(text);
      if (validateReceipts(receipts)) {
        return { receipts, template: tpl.name };
      }
    } catch { /* fall through to LLM */ }
    return null; // template matched but failed — don't try others, go straight to LLM
  }
  return null;
}
