## Goal

Prep the repo for Claude Code (desktop, via MCP) to build the real Invoiciify backend — uploads (PDF/JPEG/DOCX/XLSX), Google Drive ingestion, background parsing jobs — against Supabase. No mock data anywhere; every backend hand-off point documented; one authoritative `CLAUDE.md` you can hand to Claude.

## What I'll change

### 1. Rip out all mock/sample data

Delete `src/data/mockData.ts` and `src/data/sampleData.js` (299 + 161 lines of fake data). Create `src/lib/dataSource.ts` — the single boundary between the UI and Supabase — that keeps the TypeScript types as the API contract but exports empty arrays for every collection until Claude wires it to the real database.

Update every consumer to import from `dataSource` and render empty states:
- `src/components/designs/Glassmorphism.tsx` — top-level guard: if no data has been ingested yet, render one "MyCFO will appear once invoices are ingested" placeholder instead of the 6 empty report cards
- `src/components/canvas/CanvasTab.tsx` — Canvas stays visible as an empty scaffold (per your approval)
- `src/components/library/LibraryTab.tsx` — already has an empty state; just swap the import
- `src/components/mycfo/MyCFOTab.tsx` — swap imports (this file is currently unused but must still compile)
- `src/pages/Home.tsx` — swap `cfoMessages` import; unread badge count starts at 0
- `src/components/NotificationBell.tsx` — swap import; bell shows no notifications

Nothing structural is removed — every tab and card still exists, they just render empty until real data lands.

### 2. `CLAUDE_NOTE` cookies audit

Every backend hand-off point gets a 4-part cookie:
1. **Purpose** — what the block does for the user
2. **Data contract** — the exact type / table / column shape it consumes
3. **Math** — formulas, thresholds, edge cases (if analytical)
4. **Owner** — which Pillar (A–F) or feature it belongs to

New/upgraded cookies at: `src/lib/dataSource.ts` (top of file — the master contract), every sub-report inside `Glassmorphism.tsx`, `CanvasTab.tsx`, `LibraryTab.tsx`, `Home.tsx` (auth + tab shell), and `NotificationBell.tsx`.

### 3. Rewrite `CLAUDE.md` as the Claude-Code handoff

Reorganised so Claude Code can start work from a single read:
- **Repo tour** — stack, routes, key files, tab layout
- **Auth model** — single-user, signup locked, session handling rules
- **Data ingestion (new)** — supported formats (PDF, JPEG, DOCX, XLSX), the parse-pipeline contract, and the "long jobs run in the background" rule (queue table + polling from the UI)
- **Google Drive (new)** — folder-watch model, Drive is a *source* not a target, which Supabase table records ingested files
- **Backend expectations** — schema is user-defined; Claude must ask before creating tables; RLS + GRANT rules; storage bucket for raw uploads; edge functions for parsing + Drive polling; use the Lovable App connector for Drive (single-user)
- **6 Logic Pillars** + **Math contracts** (kept, sharpened)
- **Cookie convention** (kept, sharpened)
- **Working rules** — no mock data, no invented business logic, always update the cookie when math changes
- **MCP setup for Claude Desktop** — a copy-pasteable `claude_desktop_config.json` covering:
  - Supabase MCP (project ref + access token placeholders, read-only recommended for first pass)
  - GitHub MCP (this repo)
  - Filesystem MCP (the local clone)
- **Kickoff prompt** at the very bottom — a copy-pasteable first message to Claude Code that tells it to read this doc, grep `CLAUDE_NOTE`, and ask before running migrations

## What I will NOT do

- Not create any Supabase tables, storage buckets, or edge functions — you're defining the schema.
- Not touch auth config.
- Not add the Google Drive App connector yet — the doc lists the exact tool call so Claude runs it after the schema exists.
- Not build the upload UI yet — empty-state placeholders only; the doc tells Claude to build the flow.

## Deliverable

A mock-data-free repo that still renders (empty everywhere), every `CLAUDE_NOTE` upgraded, and a `CLAUDE.md` you can hand to Claude Code verbatim with an MCP config block and a kickoff prompt at the bottom.
