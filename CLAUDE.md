# CLAUDE.md — Invoiciify handoff for Claude Code

This is a single-owner (private) Vite + React + TypeScript + Tailwind app
called **Invoiciify**. It's a BI-style spend-analytics tool. The frontend
is production-ready as an empty scaffold; your job is to build the real
backend around it.

Read this whole file before touching anything. Then `rg CLAUDE_NOTE` to
see every backend hand-off point inline in the code.

---

## 1. Repo tour

| Path | What it is |
|------|------------|
| `src/pages/Website.tsx` | `/` — private sign-in gate (email + password). NOT a marketing page. |
| `src/pages/Home.tsx` | `/app` — auth-gated dashboard. Header + 4 tabs. |
| `src/components/canvas/CanvasTab.tsx` | Drag-and-drop BI builder (DataPane, ShelfSystem, VizCanvas). |
| `src/components/library/LibraryTab.tsx` | Saved Canvas configs. |
| `src/components/designs/Glassmorphism.tsx` | The **MyCFO tab** — six pillar reports (Arbitrage, Price Drift, Spending, Vendor, Integrity). Big file (~1600 lines), all sub-components live here. |
| `src/components/mycfo/MyCFOTab.tsx` | Alternate inbox-style MyCFO surface; currently NOT wired into Home. Leave it compiling. |
| `src/components/settings/SettingsTab.tsx` | Settings tab. |
| `src/components/NotificationBell.tsx`, `AIChatBubble.tsx`, `Logo.tsx` | Header widgets. |
| `src/lib/dataSource.ts` | **THE data boundary.** Every screen imports data from here. Currently exports empty arrays. |
| `src/lib/vizql.js` | Canvas pivot/aggregation engine (flatten receipts, apply filters, group). |
| `src/integrations/supabase/client.ts` | Auto-generated Supabase client. **Do not edit.** |
| `supabase/config.toml` | Auto-managed. Don't touch project-level settings. |

The Canvas, Library, MyCFO, and Settings tabs are all rendered but empty
until you wire real data. This is intentional — the user asked for a
completely clean slate.

---

## 2. Auth model

- `/` is a private email+password sign-in gate. **Signup is disabled**
  (`disable_signup: true`). One owner account exists.
- `/app` checks `supabase.auth.getSession()` on mount and redirects to
  `/` if there is no session. Sign out lives in the header.
- No `profiles` table, no `user_roles` table, no OAuth providers. Do NOT
  add roles/profiles/social login unless the user asks.
- HIBP (leaked-password) check is off (personal-use project).
- Session handling rules:
  - Register `onAuthStateChange` early.
  - Use `getUser()` for anything that must trust the user.
  - Use `getSession()` only for token attachment.
- If multi-user is ever added later, follow the standard Lovable pattern:
  separate `user_roles` table + `has_role()` SECURITY DEFINER function +
  RLS policies keyed off `auth.uid()`. **Never** store roles on a profile
  row.

---

## 3. Data ingestion (build this)

The whole point of the app: the user (single owner) drops invoices in,
Invoiciify parses them into structured receipts + line items, and the
six MyCFO pillars light up.

### Accepted upload formats

- **PDF** — invoices, receipts (scanned or native)
- **JPEG / PNG** — photos of paper receipts
- **DOCX** — Word invoices
- **XLSX / XLS** — Excel invoices, statement exports

### Contract

Uploads MUST land as `Receipt` + `LineItem[]` in the shape defined at
the top of `src/lib/dataSource.ts`. That shape is the app-wide API
contract; the six pillars aggregate over it.

### Background jobs (mandatory)

Parsing can take a while (OCR on scanned PDFs, LLM extraction on messy
DOCX/XLSX). Do NOT block the UI. The pattern is:

1. User uploads → file goes straight to a Supabase **Storage** bucket
   (`raw-uploads/`).
2. A row is inserted into an `uploads` table (`status: 'queued'`).
3. A background parser (edge function, triggered by row insert or by
   `pg_cron`) processes the file:
   - Sets `status: 'processing'`
   - Runs the format-specific parser (see below)
   - Writes `receipts` + `line_items` rows on success
   - Sets `status: 'complete'` (or `'failed'` + `error_message`)
4. The UI polls or subscribes (Supabase Realtime) to the row's status
   and updates the "Uploads" list in-place.

**Ask the user before you create tables.** They've said they'll define
the schema themselves. Recommended shape once they green-light it:

```text
uploads          (id, source, storage_path, filename, mime_type, status,
                  error_message, receipt_id, created_at, updated_at)
receipts         (id, upload_id, merchant, date, subtotal, tax, total,
                  currency, category, filename, custom_fields JSONB,
                  created_at)
line_items       (id, receipt_id, name, quantity, unit_price, total_price)
```

`source` is `'manual'`, `'google_drive'`, or `'email'` (future). Every
table needs RLS enabled and GRANTs to `authenticated` + `service_role`
per the standard Lovable Cloud pattern — no `anon` grants (single user
only, always signed in).

### Parsing strategy (suggested, ask before implementing)

- **PDF (native text)** → `pdf-parse` or `pdfjs` → LLM extraction
- **PDF (scanned) / JPEG / PNG** → OCR (Tesseract via edge function, or
  the multimodal image input on a chat model) → LLM extraction
- **DOCX** → `mammoth` or `docx` → LLM extraction
- **XLSX** → `xlsx`/`SheetJS` → deterministic mapper first, LLM fallback
  for unknown layouts

Use the **Gemini API directly** (`google/gemini-3.6-flash`) with the key stored in Supabase secrets (`GEMINI_API_KEY`). The project now runs on an external Supabase project, so the Lovable AI Gateway (`LOVABLE_API_KEY`) is no longer used by the edge functions. Never expose the Gemini key client-side.

---

## 4. Google Drive (build this)

Drive is a **source** of invoice files, not a destination. Model:

- User connects **their own** Google account (this is a single-user
  app, so use the workspace-level **App connector** for Google Drive,
  not the per-end-user App User Connector).
- User picks a watched folder (Drive folder ID stored in a
  `drive_config` table row).
- A background poller (edge function on a `pg_cron` schedule, e.g. every
  15 min) lists new files in that folder since the last cursor, streams
  each new PDF/JPEG/DOCX/XLSX into the `raw-uploads/` bucket, inserts
  an `uploads` row with `source: 'google_drive'`, and moves the file
  into a "processed" subfolder (or tags it) so it isn't re-ingested.

### To connect Drive at runtime

Use the standard Lovable connector tools — **ask before running them**:

```text
standard_connectors--list_app_connectors        # confirm google_drive is available
standard_connectors--connect                    # connector_id: "google_drive"
```

Once linked, call the Drive API through the gateway
(`https://connector-gateway.lovable.dev/google_drive/drive/v3/...`) using
the `GOOGLE_DRIVE_API_KEY` + `LOVABLE_API_KEY` env vars — never call
`googleapis.com` directly. Full endpoint reference is in the
`google_drive` knowledge file.

---

## 5. The 6 Logic Pillars

| Pillar | Concept | Owns in UI |
|--------|---------|------------|
| A | Invoice Integrity | `IntegrityReport` in `Glassmorphism.tsx`, red pulse on quadrant |
| B | Price Drift | `PriceDriftReport` |
| C | Lazy Tax / Arbitrage | `ArbitrageReport`, drawer "Find alternatives" CTA |
| D | Vendor Bloat | `VendorReport` |
| E | Operational Inertia (recurring detector) | `SpendingReport` Zone 4 Row A, sparkline history |
| F | (reserved) | — |

### Math contracts (do not change without updating the cookie)

**Variance decomposition (SpendingReport Zone 2):**
- `growthDollars = (thisMonthQty - lastMonthQty) * lastUnitPrice`
- `wasteDollars  = (thisUnitPrice  - lastUnitPrice) * thisMonthQty`
- baseline + growth + waste + new-vendor segments must reconcile to
  total this-month spend.

**Price drift (Pillar B):**
- `driftPercent = (currentPrice - avg90Day) / avg90Day * 100`
- Status: `alert` >5%, `warning` 2–5%, `stable` <2%.

**Lazy tax / arbitrage (Pillar C):**
- `bestPrice      = MIN(vendors[].price)`
- `lazyTax        = currentPrice - bestPrice`
- `monthlyQty     = SUM(vendors[].qty)` over trailing 30 days
- `monthlySavings = lazyTax * monthlyQty`
- `annualSavings  = monthlySavings * 12`   (labeled "Yearly Savings" in the UI)

**Overpaying % (arbitrage drawer):**
- `overpayPct = (lazyTax / bestPrice) * 100`  (markup over best)

---

## 6. Cookie convention

Every `CLAUDE_NOTE` in the code follows this 4-part format:

1. **Purpose** — what the block does for the user
2. **Data contract** — the exact type / table / column shape it consumes
3. **Math** — formulas, thresholds, edge cases (if analytical)
4. **Owner** — which Pillar (A–F) or feature

Rules:
- When you change UI math, update the cookie in the SAME edit.
- When you add a new backend hand-off point, add a cookie.
- Never delete a cookie — refine it or move it if the block moves.

Find them all with `rg CLAUDE_NOTE`.

---

## 7. Working rules for Claude Code

1. **No mock data. Ever.** The user explicitly asked for the app to be
   completely clean. If you need to test with data, insert real rows
   into Supabase via a migration + `INSERT` (ask first) — do not
   reintroduce `src/data/mockData.ts` or `src/data/sampleData.js`.
2. **UI-only by default.** Don't invent business logic beyond a cookie
   or an explicit request.
3. **Ask before creating Supabase tables.** The user is defining the
   schema. Propose the shape from section 3 above, then wait for OK.
4. **Every new `public` table needs GRANTs in the same migration.**
   RLS alone is not enough on Lovable Cloud:
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
   GRANT ALL ON public.<t> TO service_role;
   -- no anon grant (single-user, always signed in)
   ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
   CREATE POLICY ...
   ```
5. **Use semantic Tailwind tokens** from `index.css` / `tailwind.config.ts`.
   No hardcoded hex in components (chart color literals inside
   `Glassmorphism.tsx` are the pre-existing exception).
6. **`src/lib/dataSource.ts` is the ONLY place that talks to the
   backend.** Every component imports from there. When you wire
   Supabase, replace the empty exports with async fetchers / hooks;
   don't scatter `supabase.from(...)` calls across components.
7. **`src/integrations/supabase/client.ts` and `src/integrations/supabase/types.ts`
   are auto-generated. Do NOT edit.**
8. **No re-introducing removed features.** `.lovable/plan.md` history
   lists what was deliberately deleted. Don't add them back without an
   explicit ask.
9. **GitHub sync is automatic in Lovable.** Every save pushes to the
   connected repo. When you (Claude Code) push, the changes flow back
   into Lovable on next pull. Prefer small, well-messaged commits.

---

## 8. Brand palette (for logos, marketing, chart colors)

- **Emerald / Healthy Growth**: `#22C55E`
- **Indigo / Baseline Neutral**: `#6366F1` (primary)
- **Amber / Watch**: `#F59E0B`
- **Red / Waste / Critical**: `#EF4444`
- **White / Glass Surface**: `#FFFFFF`
- **Soft Gray / Borders**: `#E5E7EB` / `#CBD5E1`
- **Dark Text**: `#0F172A`
- **Muted Text**: `#64748B`

Logo mark uses Indigo primary + Emerald accent on a dark slate wordmark.

---

## 9. MCP setup for Claude Desktop

Add these to `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows), then
restart Claude Desktop.

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<YOUR_SUPABASE_PROJECT_REF>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN>"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_GITHUB_PAT>"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "<ABSOLUTE_PATH_TO_YOUR_LOCAL_CLONE>"
      ]
    }
  }
}
```

### Placeholders — how to get each

- **`<YOUR_SUPABASE_PROJECT_REF>`** — Lovable → Backend button → the ref
  in the URL. You can also ask Lovable "what is my Supabase project ref".
- **`<YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN>`** — <https://supabase.com/dashboard/account/tokens>
  → *Generate new token*. Scope: whatever you're comfortable with. Keep
  `--read-only` on until you trust Claude with writes.
- **`<YOUR_GITHUB_PAT>`** — <https://github.com/settings/tokens?type=beta>
  → fine-grained token → scoped to just this repo → Contents: R/W,
  Pull requests: R/W.
- **`<ABSOLUTE_PATH_TO_YOUR_LOCAL_CLONE>`** — where you `git clone`d the
  Lovable-synced GitHub repo. Example: `/Users/you/code/invoiciify`.

### Why these three

- **Supabase MCP** lets Claude read your schema, run queries, and (when
  you drop `--read-only`) run migrations directly.
- **GitHub MCP** lets Claude open PRs and read repo history without
  needing the local clone up to date.
- **Filesystem MCP** lets Claude edit code in your local clone
  directly. Every save round-trips through GitHub → Lovable.

### Optional: Google Drive MCP

Skip this for now. Ingestion runs via the Lovable App connector +
edge functions (section 4), not through Claude's own Drive access.
Only add a Drive MCP if you want Claude to *explore* invoice examples
while designing the parser.

---

## 10. Kickoff prompt (paste this into Claude Code first)

> I'm Claude Code working on **Invoiciify**, a single-owner spend-analytics
> app. Before you write anything:
>
> 1. Read `CLAUDE.md` from top to bottom.
> 2. Run `rg CLAUDE_NOTE` and skim every hit — those are the backend
>    hand-off points.
> 3. Open `src/lib/dataSource.ts` and confirm you understand it's the
>    single boundary between UI and backend.
> 4. Look at the current Supabase schema (via the Supabase MCP). It's
>    empty except for `auth`. Do NOT create tables yet.
>
> Then, before you touch anything, tell me:
> - What the app does (in your own words)
> - The exact schema you'd propose for `uploads`, `receipts`, `line_items`
>   (matching the types in `src/lib/dataSource.ts`)
> - Which edge functions you'd create, in what order, for the ingestion
>   pipeline
> - Any assumptions you're making that I should confirm
>
> Wait for my OK on the schema before running any migrations. When you
> do run one, include GRANTs and RLS in the SAME migration per the rules
> in section 7 of `CLAUDE.md`. No mock data, ever.

---

## 11. Where to look first (quick reference)

- `src/lib/dataSource.ts` — the contract
- `src/components/designs/Glassmorphism.tsx` — the six pillars, all
  math cookies inline
- `src/pages/Home.tsx` — auth guard + tab shell
- `.lovable/plan.md` — the last approved plan (updated on every plan
  approval); read for historical context
- `supabase/functions/` — currently empty; put edge functions here
