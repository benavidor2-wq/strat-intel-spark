# Split into two projects

Goal: this project becomes the app-only Invoiciify (routed at `/app`, backend intact). A remixed sibling project becomes the marketing site (landing page at `/`, no backend).

Since Lovable can only write into the *current* project, the split happens in two phases: you remix in the UI, then I clean up each side from inside its own project.

---

## Phase 1 — You do this in the Lovable UI

1. Open this project's title menu (top-left) → **Remix this project**.
2. Name the remix something like `invoiciify-marketing`.
3. Leave this project as-is until Phase 2 is approved — we don't want to delete the landing page here before the remix exists.

Result: two identical projects, each with its own URL, chat, and (empty on the remix) Lovable Cloud backend.

---

## Phase 2a — Clean up THIS project (app only)

Scope of edits, all frontend:

- `src/App.tsx`: remove the `/` route that renders `Website`. Make `/app` (or `/`) render `Home` directly. Redirect unknown paths to the app.
- Delete `src/pages/Website.tsx` and any landing-only assets it imports (hero image, marketing-only sections) that nothing else uses.
- Remove `framer-motion` from `package.json` **only if** nothing in the app tab uses it. I'll grep first before removing.
- Update `index.html` `<title>` + meta description to app-only copy ("Invoiciify — Invoice analytics dashboard").
- Leave Lovable Cloud, `sampleData`, `vizql`, `Glassmorphism` MyCFO hub, recharts, lodash all in place.

## Phase 2b — Clean up the REMIX project (marketing only)

I can't touch the remix from here. Once you open the remix and send me a message inside it, I'll:

- Keep `src/pages/Website.tsx` unchanged so the landing page looks identical.
- `src/App.tsx`: route `/` → `Website`, drop the `/app` route.
- Delete `src/pages/Home.tsx`, `src/components/canvas/**`, `src/components/mycfo/**` (if present), `src/components/designs/Glassmorphism.tsx`, `src/data/sampleData.js`, `src/data/mockData.ts`, `src/lib/vizql.js`, `AIChatBubble`, `NotificationBell` — anything the landing page doesn't import.
- Remove now-unused deps: `recharts`, `lodash`, `@types/lodash`, and the Lovable Cloud client files if the landing page doesn't call the backend.
- Update `index.html` title/meta to marketing copy.
- Leave CTA buttons as-is (per your answer).

Before deleting anything I'll run an import graph from `Website.tsx` and only remove files with zero remaining references.

---

## What each project ends up with

```text
THIS project (app)              REMIX project (marketing)
├── /  or /app → Home           ├── / → Website
├── Canvas / Library / MyCFO    ├── Landing hero, features, pricing
├── Glassmorphism strategic hub ├── No backend, no charts
├── sampleData + vizql          ├── Framer-motion + shadcn only
└── Lovable Cloud backend       └── Static site
```

## Notes

- No shared package — each project owns its own copy, per your answer ("connection does not matter").
- CTAs stay pointing wherever they point today; you'll rewire them after publishing.
- Publishing: each project publishes to its own `*.lovable.app` URL independently.

Reply **"remix done"** once Phase 1 is complete and I'll execute Phase 2a here. Phase 2b happens from inside the remix.
