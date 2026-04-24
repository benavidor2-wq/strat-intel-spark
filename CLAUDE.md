# CLAUDE.md

Operating notes for Claude (and other coding agents) working on this repo.
The frontend is the source of truth for UX; this file documents how the
backend is expected to feed it.

## Project shape

- React 18 + Vite + TypeScript + Tailwind. Single-page demo of a
  Strategic Intelligence Engine for procurement / spend analytics.
- Main surface: `src/components/designs/Glassmorphism.tsx`
  (one file, multiple report sub-components).
- Mock data: `src/data/mockData.ts`. Treat its TypeScript interfaces
  as the API contract the backend must satisfy.

## The 6 Logic Pillars

| Pillar | Concept            | Owns in UI                                  |
|--------|--------------------|---------------------------------------------|
| A      | Invoice Integrity  | `IntegrityReport`, red pulse on quadrant    |
| B      | Price Drift        | `PriceDriftReport`, Waste segment math      |
| C      | Lazy Tax / Arbitrage | `ArbitrageReport`, drawer "Find alternatives" CTA |
| D      | Vendor Bloat       | `VendorReport`                              |
| E      | Operational Inertia (recurring detector) | `SpendingReport` Zone 4 Row A, sparkline history |
| F      | (reserved)         | —                                           |

## Cookie convention

Search the codebase for `CLAUDE_NOTE` to find every backend hand-off
point. Each cookie spells out the math contract or data source the
backend must honor. **When you change UI math, update the cookie.**
When you add a new section that depends on backend data, add a cookie.

## Math contracts (current)

### Variance decomposition (Zone 2)
- `growthDollars = (thisMonthQty - lastMonthQty) * lastUnitPrice`
- `wasteDollars  = (thisUnitPrice - lastUnitPrice) * thisMonthQty`
- baseline + growth + waste + new-vendor segments must reconcile to
  total this-month spend.

### Price drift (Pillar B)
- `driftPercent = (currentPrice - avg90Day) / avg90Day * 100`
- Status: `alert` >5%, `warning` 2–5%, `stable` <2%.

### Lazy tax / arbitrage (Pillar C)
- `bestPrice      = MIN(vendors[].price)`
- `lazyTax        = currentPrice - bestPrice`
- `monthlyQty     = SUM(vendors[].qty)` over trailing 30 days
- `monthlySavings = lazyTax * monthlyQty`
- `annualSavings  = monthlySavings * 12`

## Working rules for Claude

1. **UI-only by default.** Don't invent business logic outside what a
   cookie or the user explicitly asks for.
2. **Use semantic Tailwind tokens** from `index.css` /
   `tailwind.config.ts`. No hard-coded hex in components except where
   already inlined for chart colors.
3. **Keep `mockData.ts` as the contract.** If you change a calculation,
   update both the data interface and the relevant `CLAUDE_NOTE`.
4. **No re-introducing removed features.** The plan in
   `.lovable/plan.md` lists what was deliberately deleted (Efficiency
   Ring, Discovery Bubble Map, AI Narrative banner, Semantic Dimension
   pills). Do not add them back without an explicit ask.
5. **GitHub sync is automatic** — every save in Lovable pushes to the
   connected repo. No manual git commands needed (and the agent isn't
   allowed to run them anyway).

## Where to look first

- `.lovable/plan.md` — current Spending Patterns redesign spec.
- `src/data/mockData.ts` — data contracts and seed data.
- `src/components/designs/Glassmorphism.tsx` — all report UIs; grep
  `CLAUDE_NOTE` for backend hand-off points.
