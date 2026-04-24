# CLAUD.md — Backend Integration Cookies

This file tells Claude (or any backend dev) exactly what each piece of the CFO dashboard expects from the data layer. The UI is **read-only** — every number on screen comes from a server-computed value. Do not move math into the front end.

The dashboard lives in `src/components/designs/Glassmorphism.tsx` and is organized into **5 pillars**:

| Pillar | Tab label                    | Component             | What it answers                               |
| ------ | ---------------------------- | --------------------- | --------------------------------------------- |
| A      | Anomaly & Risk               | `IntegrityReport`     | What looks fraudulent or out-of-policy?       |
| B      | Price Drift                  | `PriceDriftReport`    | Which unit prices are creeping up?            |
| C      | Vendor Arbitrage             | `ArbitrageReport`     | Where am I overpaying vs. the cheapest vendor?|
| D      | Vendor Consolidation         | `VendorReport`        | Can I shrink my vendor list?                  |
| E      | Spending Patterns            | `SpendingReport`      | Where did this month's spend actually come from?|

Search the codebase for `CLAUDE_NOTE` to find every place the UI expects a backend hook.

---

## Color & threshold contract (must stay in sync across pillars)

| Color  | Token                       | Meaning                          | Threshold (price drift) |
| ------ | --------------------------- | -------------------------------- | ----------------------- |
| Emerald| `--finance-emerald`         | Healthy / scaling                | drift ≤ 3%              |
| Amber  | `--risk-high`               | Watch                            | 3% < drift ≤ 10%        |
| Red    | `--destructive`             | Waste / fix now                  | drift > 10%             |
| Indigo | `--finance-indigo`          | Baseline / new commitment        | n/a                     |

`PriceDriftReport.status` and `SpendingReport` quadrant colors **must use the same thresholds**.

---

## Pillar A — Anomaly & Risk (`IntegrityReport`)

Backend rules engine produces `integrity_alerts` rows. UI never recomputes severity.

```ts
type IntegrityAlert = {
  id: string;
  type: 'duplicate_invoice' | 'ghost_vendor' | 'off_contract' | 'round_dollar' | 'weekend_invoice' | ...;
  severity: 'critical' | 'high' | 'medium';   // drives sort + MetricTile color
  evidence: Array<{invoiceNo, vendor, amount, date}>;
  recommendedAction: string;                  // becomes the CTA label
  handoff: string[];                          // ordered investigator workflow steps
};
```

**Persistence requirement**: every time a user advances `handoff[i]`, write an `investigation_events` row keyed by `anomaly_id` for the audit trail.

---

## Pillar B — Price Drift (`PriceDriftReport`)

Per (product, vendor) row:

```
currentPrice = unit_price on most recent invoice
avg90Day     = AVG(unit_price) over last 90 days
driftPercent = (currentPrice - avg90Day) / avg90Day * 100
status       = driftPercent > 10 ? 'alert'
             : driftPercent > 3  ? 'warning'
             :                     'ok'
```

Click row → `PriceDriftInvoicePanel` shows the underlying invoice trail (proof of drift).

---

## Pillar C — Vendor Arbitrage (`ArbitrageReport`)

Per row of `arbitrage_opportunities`:

```
bestPrice      = MIN(unit_price) across vendors for this product, last 90 days
currentPrice   = unit_price from most recent invoice with current preferred vendor
lazyTax        = currentPrice - bestPrice                    // $/unit
overpaying %   = lazyTax / bestPrice * 100                   // markup-over-best (NOT % of current spend)
monthlyQty     = SUM(invoice.qty) across vendors, trailing 30 days
monthlySavings = lazyTax * monthlyQty
annualSavings  = monthlySavings * 12                         // or contracted annual qty * lazyTax
```

The vendor with `price === bestPrice` is rendered as a green pill with a ✓ check.

**Cleanup**: mock data has duplicate `savingsPerUnit` and `lazyTax` (same value) — drop `savingsPerUnit` server-side.

---

## Pillar D — Vendor Consolidation (`VendorReport`)

Two pies, mutually-exclusive drill-downs (only one panel open at a time — UX decision, do not change):

```
vendor pie slice angle   = vendor.monthlySpend / SUM(vendor.monthlySpend)
category pie slice angle = category.monthlySpend / SUM(category.monthlySpend)
```

Click vendor slice → `vendorProducts[vendor]` line items + matching `priceDriftItems` for that vendor.
Click category slice → `categoryVendors[category]` + `vendorConsolidation` row (consolidation savings est.).

**Consolidation savings model**: assume best-vendor unit price applied to the full category volume.

---

## Pillar E — Spending Patterns (`SpendingReport`)

The most math-heavy pillar. Three zones.

### Zone 2 — Variance Decomposition Bar

Decomposes month-over-month change into 4 attributable buckets. Per commodity:

```
thisMonthSpend  = thisMonthQty * thisUnitPrice
lastMonthSpend  = lastMonthQty * lastUnitPrice
volumeDeltaPct  = (thisMonthQty - lastMonthQty) / lastMonthQty * 100
priceDeltaPct   = (thisUnitPrice - baseline90d) / baseline90d * 100

growthDollars     = (thisMonthQty - lastMonthQty) * lastUnitPrice    // volume change @ old price
wasteDollars      = (thisUnitPrice - baseline90d) * thisMonthQty     // price drift @ new volume
newVendorDollars  = isNewVendor ? thisMonthSpend : 0
```

**Reconciliation identity**:
```
lastMonthSpend + growthDollars + wasteDollars + newVendorDollars == thisMonthSpend
```
This must hold to the cent. If it doesn't, the backend has a rounding bug.

### Zone 3 — Quadrant Map (Growth vs. Waste)

```
x-axis      = volumeDeltaPct     (volume change %)
y-axis      = priceDeltaPct      (unit-price drift % vs 90-day avg)
bubble size = thisMonthSpend
color       = driftColor(priceDeltaPct)  — see threshold table above
pulse       = riskAlert (boolean, from Pillar A integrity alerts on this commodity)
```

Quadrant classification:
- **Active Bleed**: priceDeltaPct > 3% AND volumeDeltaPct > 5%
- **Quiet Leak** : priceDeltaPct > 3% AND volumeDeltaPct ≤ 5%
- **Healthy Growth**: priceDeltaPct ≤ 3% AND volumeDeltaPct > 5%
- **Stable**    : everything else

### Zone 4 — Spend Movement Grid

Toggleable two ways:

- **By commodity / By vendor**: when by-vendor, sum `thisMonthSpend` and `spendHistory` across all commodities sold by that vendor. Reminder: **a single commodity may be sourced from multiple vendors** — when grouping by commodity, sum across vendors for that `product_key`.
- **Period (monthly/quarterly/yearly)**: re-bucket the ledger by the chosen calendar bucket and recompute `thisPeriodSpend`, `lastPeriodSpend`, and the trailing-4 `spendHistory` series.

```
dollarDelta = thisPeriodSpend - lastPeriodSpend
pctDelta    = (thisPeriodSpend - lastPeriodSpend) / lastPeriodSpend * 100   // 100% if last was 0
spendHistory[] = trailing 4 buckets of total spend (length always 4)
```

Sorted by `pctDelta DESC`. Click a card → spend movement detail dialog (per-period breakdown table, big sparkline).

### Drill-down drawer (per commodity)

Read-only. CTAs:
- **Find arbitrage alternatives** → deep-link to `ArbitrageReport` filtered by `product_id` (Pillar C handoff)
- **Negotiate with {vendor}** → vendor-scoped negotiation flow (Pillar D handoff)
- **Lock in current rate** → contract management flow

---

## Data sources

All mock data lives in `src/data/mockData.ts`. Field names there match the production schema 1:1, so swapping the import for a fetch should be straightforward.

Tables the backend needs:

| Table                      | Powers                                                |
| -------------------------- | ----------------------------------------------------- |
| `invoice_lines`            | Everything (atomic source of truth)                   |
| `vendors`                  | Vendor metadata, isNew flag                           |
| `products` / `commodities` | Product key, baseline90d unit price                   |
| `contracts`                | `contractEnd` for arbitrage CTAs                      |
| `integrity_alerts`         | Pillar A rules-engine output                          |
| `investigation_events`     | Audit trail for handoff progress                      |
| `arbitrage_opportunities`  | Materialized view of Pillar C math                    |
| `vendor_consolidation`     | Materialized view of Pillar D savings estimates       |

---

## When in doubt

1. Search for `CLAUDE_NOTE` in the codebase — every UI assumption is annotated there.
2. Reconciliation identity for Pillar E must hold to the cent.
3. Drift thresholds (3% / 10%) are shared between Pillar B and Pillar E — change one, change the other.
4. The UI is read-only. If a calculation isn't on this page, it doesn't belong in the front end.
