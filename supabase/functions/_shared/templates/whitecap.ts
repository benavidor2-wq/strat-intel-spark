// White Cap, L.P. deterministic template.
//
// White Cap is ~26% of the owner's archive (~983 invoices). Their PDFs are
// native-text; `unpdf` extracts the item table COLUMN-MAJOR — a column label
// line followed by every value for that column, in top-to-bottom order.
//
// Example (whitespace collapsed):
//   LINE            1   2
//   PART NUMBER     3392TL31216   1% ASSESSMENT
//   DESCRIPTION     3X12X16 FIR #2 / BTR RS .15 CA-C   CA STATE 1% LUMBER ASSESSMENT    LAGGING LUMBER
//   QTY ORD         80   1
//   UNIT PRICE      69.96   55.97
//
// The DESCRIPTION column often has MORE tokens than LINE — trailing/
// continuation fragments (often leading-space) belong to the PRECEDING item.
// We use LINE to get the row count `n`, then take the first `n` items of
// PART NUMBER / QTY ORD / UNIT PRICE, and merge every extra DESCRIPTION
// token onto the previous row's name.

import type { VendorTemplate } from "./index.ts";

const NAME_RE = /white\s*cap(?:,?\s*l\.?p\.?)?/i;

function detect(text: string): boolean {
  return NAME_RE.test(text);
}

// Grab the value line(s) that follow a given label line. `stopAt` lets us
// know when to stop (next column header or a totals block).
function blockAfter(lines: string[], label: RegExp, stopAt: RegExp[]): string[] {
  const idx = lines.findIndex((l) => label.test(l.trim()));
  if (idx < 0) return [];
  const out: string[] = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (stopAt.some((rx) => rx.test(trimmed))) break;
    out.push(raw);
  }
  return out;
}

// Field on the line AFTER a label (single-value header fields).
function fieldAfter(lines: string[], label: RegExp): string | null {
  const idx = lines.findIndex((l) => label.test(l.trim()));
  if (idx < 0) return null;
  for (let i = idx + 1; i < lines.length; i++) {
    const v = lines[i].trim();
    if (v) return v;
  }
  return null;
}

// Numbers on the value block; each value may occupy its own line or share.
function tokensFromBlock(block: string[]): string[] {
  const toks: string[] = [];
  for (const line of block) {
    const parts = line.trim().split(/\s{2,}|\t+/g).filter(Boolean);
    if (parts.length) toks.push(...parts);
    else if (line.trim()) toks.push(line.trim());
  }
  return toks;
}

function toNum(s: string | null | undefined): number | null {
  if (!s) return null;
  const neg = /^[\(\-]/.test(s.trim());
  const digits = s.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const n = parseFloat(digits);
  if (!isFinite(n)) return null;
  return neg ? -n : n;
}

function toIsoDate(s: string | null): string | null {
  if (!s) return null;
  const m = s.trim().match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return null;
  let [_, mm, dd, yy] = m;
  if (yy.length === 2) yy = (parseInt(yy, 10) > 50 ? "19" : "20") + yy;
  const mo = mm.padStart(2, "0");
  const da = dd.padStart(2, "0");
  return `${yy}-${mo}-${da}`;
}

function parse(text: string): any[] {
  // Normalize line endings and preserve blank lines for boundary detection.
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  // Column-block stop tokens (rough: any all-caps label with 2+ words that
  // isn't a value looks like a next column heading).
  const COL_STOPS: RegExp[] = [
    /^PART\s*NUMBER\b/i,
    /^DESCRIPTION\b/i,
    /^QTY\s*ORD\b/i,
    /^QTY\s*SHIP\b/i,
    /^UNIT\s*PRICE\b/i,
    /^EXT(ENDED)?\s*PRICE\b/i,
    /^UOM\b/i,
    /^SUBTOTAL\b/i,
    /^TAX\b/i,
    /^INVOICE\s*TOTAL\b/i,
    /^TOTAL\s*DUE\b/i,
    /^AMOUNT\s*DUE\b/i,
    /^TERMS\b/i,
    /^SHIP\s*TO\b/i,
    /^BILL\s*TO\b/i,
    /^SOLD\s*TO\b/i,
    /^REMIT\s*TO\b/i,
  ];

  // 1) LINE column → row count.
  const lineBlock = blockAfter(lines, /^LINE\b/i, COL_STOPS);
  const lineToks = tokensFromBlock(lineBlock).filter((t) => /^\d+$/.test(t));
  const n = lineToks.length;
  if (n === 0) return [];

  const partToks = tokensFromBlock(blockAfter(lines, /^PART\s*NUMBER\b/i, COL_STOPS)).slice(0, n);
  const qtyToks = tokensFromBlock(blockAfter(lines, /^QTY\s*ORD\b/i, COL_STOPS)).slice(0, n);
  const priceToks = tokensFromBlock(blockAfter(lines, /^UNIT\s*PRICE\b/i, COL_STOPS)).slice(0, n);
  const uomToks = tokensFromBlock(blockAfter(lines, /^UOM\b/i, COL_STOPS)).slice(0, n);
  const extToks = tokensFromBlock(blockAfter(lines, /^EXT(?:ENDED)?\s*PRICE\b/i, COL_STOPS)).slice(0, n);

  // Description: merge continuations onto the PRECEDING item.
  const descRaw = blockAfter(lines, /^DESCRIPTION\b/i, COL_STOPS);
  const descs: string[] = new Array(n).fill("");
  {
    // A leading-whitespace line is a continuation of the previous description.
    // A non-leading-whitespace line starts a new description slot.
    let slot = -1;
    for (const raw of descRaw) {
      if (!raw.trim()) continue;
      const isContinuation = /^\s/.test(raw) && slot >= 0;
      if (isContinuation || slot >= n - 1) {
        // Continuation, or we've filled all n slots — append to current/last.
        const target = Math.min(slot < 0 ? 0 : slot, n - 1);
        descs[target] = (descs[target] + " " + raw.trim()).trim();
        if (slot < 0) slot = 0;
      } else {
        slot += 1;
        descs[slot] = raw.trim();
      }
    }
  }

  // Header fields.
  const invoiceNo = fieldAfter(lines, /^INVOICE\s*NUMBER\b/i);
  const invoiceDate = toIsoDate(fieldAfter(lines, /^INVOICE\s*DATE\b/i));
  const poRaw = fieldAfter(lines, /^CUSTOMER\s*PO\s*NUMBER\b/i);
  const poNumber = poRaw && !/^(TERMS|ORDER|SHIP|ACCT|CUSTOMER)\b/i.test(poRaw) ? poRaw : null;
  const terms = fieldAfter(lines, /^TERMS\b/i);
  const acctJob = fieldAfter(lines, /^ACCT\s*JOB\s*NO\.?/i);
  const custJob = fieldAfter(lines, /^CUSTOMER\s*JOB\s*NO\.?/i);

  // SHIP TO: first non-empty line after label is typically the street address.
  const shipToIdx = lines.findIndex((l) => /^SHIP\s*TO:?/i.test(l.trim()));
  let jobSite: string | null = null;
  if (shipToIdx >= 0) {
    for (let i = shipToIdx + 1; i < Math.min(shipToIdx + 6, lines.length); i++) {
      const v = lines[i].trim();
      if (!v) continue;
      if (/^(ACCOUNT|TERRITORY|BILL|SOLD|REMIT|INVOICE|CUSTOMER|ACCT|ORDER)\b/i.test(v)) break;
      jobSite = v;
      break;
    }
  }

  // Totals.
  const subtotal = toNum(fieldAfter(lines, /^SUB[- ]?TOTAL\b/i));
  const tax = toNum(fieldAfter(lines, /^(?:SALES\s+)?TAX\b/i));
  const total = toNum(
    fieldAfter(lines, /^INVOICE\s*TOTAL\b/i) ??
    fieldAfter(lines, /^TOTAL\s*DUE\b/i) ??
    fieldAfter(lines, /^AMOUNT\s*DUE\b/i),
  );

  // Assemble line items.
  const line_items: any[] = [];
  for (let i = 0; i < n; i++) {
    const quantity = toNum(qtyToks[i] ?? null);
    const unit_price = toNum(priceToks[i] ?? null);
    let total_price = toNum(extToks[i] ?? null);
    if (total_price == null && quantity != null && unit_price != null) {
      total_price = +(quantity * unit_price).toFixed(2);
    }
    const name = (descs[i] || partToks[i] || "").trim();
    if (!name) continue;
    line_items.push({
      name,
      sku: partToks[i]?.trim() || null,
      uom: uomToks[i]?.trim() || null,
      quantity,
      unit_price,
      total_price,
    });
  }

  const custom_fields: Record<string, string> = {};
  if (custJob) custom_fields["Customer Job No"] = custJob;
  if (acctJob) custom_fields["Acct Job No"] = acctJob;
  if (terms) custom_fields["Payment Terms"] = terms;
  if (poNumber) custom_fields["PO Number"] = poNumber;
  if (jobSite) custom_fields["Job Site"] = jobSite;

  // bill_to: look between SOLD TO / BILL TO block and TERRITORY:/SHIP TO:.
  let bill_to: string | null = null;
  const billIdx = lines.findIndex((l) => /^(SOLD|BILL)\s*TO:?/i.test(l.trim()));
  if (billIdx >= 0) {
    for (let i = billIdx + 1; i < Math.min(billIdx + 6, lines.length); i++) {
      const v = lines[i].trim();
      if (!v) continue;
      if (/^(TERRITORY|SHIP|REMIT|INVOICE|ACCOUNT|ACCT)\b/i.test(v)) break;
      bill_to = v;
      break;
    }
  }

  return [{
    merchant: "White Cap, L.P.",
    invoice_no: invoiceNo,
    date: invoiceDate,
    subtotal,
    tax,
    total,
    currency: "USD",
    category: "Materials",
    bill_to,
    custom_fields,
    line_items,
  }];
}

export const whitecapTemplate: VendorTemplate = {
  name: "whitecap-template",
  detect,
  parse,
};
