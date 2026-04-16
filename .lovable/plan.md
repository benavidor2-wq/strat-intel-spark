

## Plan: Redesign Vendor Consolidation Page

### Current issues
- The two pie charts sit in a plain white card with minimal visual hierarchy
- Labels around the charts look cluttered and small
- The drill-down panel below feels disconnected from the chart it relates to
- Overall layout doesn't use vertical space well -- feels sparse yet cramped at the same time

### New design

**Layout: Stacked sections instead of side-by-side in a single card**

1. **Page header** — "Vendor Consolidation" title with a subtle gradient accent bar, plus a total spend summary (e.g., "$210K/mo across 8 vendors, 5 categories")

2. **Charts row** — Two equal-width cards side by side, each with its own glassmorphism card containing:
   - A clear title with an icon and colored accent
   - The donut chart centered with a **total spend figure in the center** of the donut (not just a hole)
   - A clean **legend below the chart** (horizontal pills/chips with color dots) instead of Recharts' scattered external labels
   - Subtle hover effect on the card and active state when a slice is selected

3. **Drill-down panel** — Appears below the relevant chart's card (not spanning full width). Uses a colored top border matching the selected slice's color. Slides in with a smooth animation. The panel connects visually to its parent chart card.

### Technical changes

**`src/components/designs/Glassmorphism.tsx`** (VendorReport):
- Replace the single wrapping `glass` div with two separate styled cards
- Remove Recharts `label` prop; add a custom center label (`text` element inside PieChart) showing total spend
- Add a legend component below each chart using color-coded pills
- Move drill-down panels to sit directly below their respective chart card using a flex-col layout per side
- Add a colored top-border accent on drill-down panels matching the selected slice color
- Add subtle `ring` or `shadow` highlight on the chart card when a slice is selected
- Add a small summary stat row at the top (total vendors, total categories, total monthly spend)

### Files modified
- `src/components/designs/Glassmorphism.tsx` — Redesign VendorReport layout and styling

