## New tab: Project Overview

Add a fourth tab to the `/app` header (after MyCFO, before Settings placement stays as-is) called **Projects** that lets the owner pick a project and see every item purchased for it, grouped by vendor with a per-item breakdown and a grand total.

### What the user sees

1. **Project picker** at the top — a searchable dropdown of every distinct project value found across receipts' custom fields (Job Site, Project, Job Code, PO Number, merged into one list, deduped case-insensitively).
2. **Summary strip** — big Grand Total $, receipt count, vendor count, line count, date range.
3. **Spend by Vendor bar chart** — one bar per vendor on the project, sorted by spend desc.
4. **Vendor → Items breakdown** — collapsible vendor sections. Each vendor shows its subtotal, then a flat item table (date, item name, qty, unit price, line total) sortable by any column. Every line item on the project appears; nothing is aggregated across lines.
5. Empty state when no project selected or no matching receipts.

### Data wiring (frontend only)

- New hook in `src/lib/dataSource.ts`: `useProjects()` — reads from the cached `useReceipts()` result, scans each receipt's `custom_fields` for keys matching `job site | project | job code | po number` (case-insensitive), returns a sorted unique list of values with a receipt count per project.
- New hook `useProjectDetail(projectValue)` — filters cached receipts whose custom_fields contain that value in any of the four keys, flattens their `line_items`, and returns `{ receipts, lineItems, totalsByVendor, grandTotal, dateRange }`.
- No new Supabase calls, no schema changes, no edge function work. Pure client-side derivation from existing `receipts_full` data already loaded by React Query.

### Files

- `src/pages/Home.tsx` — add `projects` to the tab list and route it to the new component.
- `src/components/projects/ProjectsTab.tsx` — new: picker + summary + chart + vendor/item breakdown.
- `src/components/projects/ProjectPicker.tsx` — new: shadcn Command combobox.
- `src/lib/dataSource.ts` — add `useProjects` and `useProjectDetail` selectors.

### Design

Reuse existing semantic Tailwind tokens and shadcn primitives (Card, Table, Collapsible, Command). Bar chart via `recharts` (already in the project). Match the glass/neutral aesthetic used by MyCFO and Canvas — no new palette.

### Out of scope

- No editing of project assignments on receipts.
- No CSV export in this pass (easy to add later).
- No changes to ingestion, parsers, or the database.