

# Spending Patterns Redesign — Updated (Zones 1 & 5 removed)

## Page Structure

### Zone 2 — Variance Decomposition Bar (now top of page)
A single horizontal stacked bar showing **Last Month → This Month** broken into 4 segments:

```text
[ Baseline spend ][ + Volume (Growth) ][ + Price Drift (Waste) ][ + New Vendors ]
   $245K              +$31K green         +$16K red               +$4K indigo
```

- Hover any segment → tooltip explains the math (units × unit price delta).
- Click a segment → filters Zone 3 & 4 to only commodities driving that segment.

### Zone 3 — Growth vs. Waste Quadrant Map
A 2×2 scatter plot. Each dot = one commodity (vendor + product).

```text
                  PRICE DRIFT (Waste) ↑
                  │
   QUIET LEAK     │   ACTIVE BLEED
   (low vol,      │   (high vol,
    high price)   │    high price) ← biggest fix targets
   ───────────────┼───────────────→  VOLUME CHANGE
   STABLE         │   HEALTHY GROWTH
   (low vol,      │   (high vol,
    flat price)   │    flat price) ← what "good" looks like
                  │
```

- **X-axis**: Volume change % (MoM)
- **Y-axis**: Unit-price drift % vs 90-day average
- **Bubble size**: Total $ spent on that commodity this month
- **Color**: Emerald (price flat or down) → Amber (3–10% drift) → Red (>10% drift)
- **Pulse animation**: commodities with active integrity alerts
- **Hover**: "Copper Wire from MetalWorks — bought 11% more units AND paid 15.7% more per kg. $4.2K of the increase is waste."
- **Click**: opens drill-down drawer pre-filtered to that commodity.

### Zone 4 — Inertia Strip (Recurring vs. Discretionary)
A compact two-row visualization below the quadrant:

**Row A — Operational Inertia (Recurring)**
Horizontal track of commodities the engine identified as recurring (matching interval pattern). Shows: cadence (monthly/weekly), last 3 invoice unit-prices as sparkline, drift indicator.

**Row B — Discretionary (One-Off)**
Same layout for invoices that broke pattern this month. These are the "new commitments" worth reviewing.

This visualizes the **"Operational Inertia" pattern recognition** concept — predictable intervals on top, variable spend below.

### Drill-Down Drawer (right side, opens from Zone 3 or 4)
When a commodity is selected:

- **Decomposition**: "$13.4K spent. $8.2K explained by volume (+15% units). $3.1K explained by unit-price drift (+12%). $2.1K baseline."
- **Last 4 invoices** with unit price, qty, total — sparkline showing price trajectory
- **Verdict**: Growth / Mixed / Waste with one-line reasoning
- **Action button**: *"Find arbitrage alternatives"* or *"Negotiate with vendor"*

## Visual & Interaction Rules

- **Color semantics** (consistent across all zones):
  - Emerald `#22c55e` = Growth / Healthy
  - Indigo `#6366f1` = Baseline / Neutral
  - Amber = Watch (3–10% drift)
  - Red = Waste / Fix now (>10% drift or active alert)
- **No line charts** — replaced by Variance Bar + Quadrant Map + Inertia Strip.
- **Single source of truth**: every zone reacts to the same selected commodity.
- **Stupid-simple framing**: each zone answers one English question (Where did the change come from, Which commodities are bleeding, What's recurring vs new).

## Technical Implementation

- **File**: rewrite Spending Patterns section in `src/components/designs/Glassmorphism.tsx` (replace current Efficiency Ring + Bubble Map block).
- **Data layer** — extend `src/data/mockData.ts`:
  - `commodityVariance`: per-commodity object `{ product, vendor, lastMonthQty, thisMonthQty, lastUnitPrice, thisUnitPrice, baseline90d, isRecurring, cadence }`
  - Derived in component memo: `volumeDelta`, `priceDelta`, `growthDollars`, `wasteDollars`, `quadrant`.
- **Charts**:
  - Zone 2: Recharts `BarChart` stacked + custom tooltip.
  - Zone 3: Recharts `ScatterChart` with `ReferenceLine` at x=0 and y=0 for quadrant cross-hairs; absolute-positioned quadrant labels.
  - Zone 4: flex layout of mini cards with inline SVG sparklines (no Recharts needed).
- **State**: single `useState` for `selectedCommodityId` and `selectedSegment`. Zones derive via `useMemo`.
- **Drawer**: reuse existing `Dialog` from `src/components/ui/dialog.tsx`.
- **Animations**: keep existing `risk-pulse` keyframe.
- **Remove**: Efficiency Ring doughnut, Discovery Bubble Map, AI Narrative block, leftover `groupedMatrix` / `matrixMode` references.
- **Backend cookies** (kept as `// CLAUDE_NOTE` comments):
  - Pillar B Price Drift → Waste segment math.
  - Pillar C Lazy Tax → drawer "arbitrage alternatives" CTA.
  - Pillar A Integrity alerts → red pulse on quadrant dots.
  - Pillar E recurring-pattern detector → drives Zone 4 Row A.

## What Stays vs Goes

| Keeps | Removes |
|---|---|
| Color tokens (emerald, indigo, amber, red) | Efficiency Ring doughnut |
| `risk-pulse` animation | Discovery Bubble Map |
| Dialog drill-down pattern | AI Narrative banner (Zone 1) |
| Existing `mockData.ts` interfaces | Semantic Dimension pills (Zone 5) |
| Glassmorphism card styling | Any line/area chart for spend over time |

