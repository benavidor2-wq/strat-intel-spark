

## Plan: Full-Page Vendor Charts with Interactive Drill-Down

### What changes

**1. Make the Vendor Consolidation charts full-width**
- Remove the `grid-cols-2` constraint and make each pie chart take up more space
- Increase chart heights from `h-48` to `h-80` or similar
- Increase `outerRadius`/`innerRadius` so charts are larger and more readable
- Use the full width of the content area (side-by-side at ~50% each, but much taller)

**2. Add click interactivity to pie chart slices**

When a user clicks a slice on either pie chart, an expandable detail panel appears below that chart showing relevant drill-down data:

- **Spend by Vendor** — clicking a vendor slice (e.g., "SteelCo") shows:
  - List of products purchased from that vendor
  - Recent invoices with dates, amounts, quantities
  - Price drift status for that vendor's products
  - Monthly spend trend (if data available)

- **Spend by Category** — clicking a category slice (e.g., "Raw Materials") shows:
  - Which vendors supply this category
  - Vendor count vs. industry average (from `vendorConsolidation` data)
  - Redundancy score and potential savings
  - Breakdown of spend across vendors in that category

The detail panel will animate in below the charts using `AnimatePresence` and can be dismissed by clicking the same slice again or an X button.

### Technical details

- **State**: Add `selectedVendor` and `selectedCategory` state variables to `VendorReport`
- **Pie `onClick`**: Use Recharts' `onClick` handler on each `<Pie>` to set the selected slice
- **Detail panel**: A new `<motion.div>` below the charts grid that renders contextual info based on which slice is selected
- **Data cross-referencing**: Match clicked vendor name against `priceDriftItems`, `arbitrageOpportunities`, and `vendorMonthlySpend` to show relevant details. Match clicked category against `vendorConsolidation` and `spendByCategory`.
- **Visual feedback**: Highlight the selected slice (slightly increased radius or opacity change on other slices)
- **Mock drill-down data**: Add a `vendorProducts` mapping in `mockData.ts` linking vendors to their categories/products for richer detail panels

### Files modified
- `src/components/designs/Glassmorphism.tsx` — Expand `VendorReport` with larger charts, click handlers, and drill-down panel
- `src/data/mockData.ts` — Add vendor-to-category/product mapping data for drill-downs

