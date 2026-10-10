# Audit harness

Two throw-away Playwright scripts used to produce the measurements in [`../AUDIT.md`](../AUDIT.md). They are **not** the project's test suite (that is planned in `docs/PLAN.md`, Phase 0) — they are kept so the numbers can be reproduced and as a starting point for the real e2e setup.

Both scripts serve the production build against a **mocked Supabase REST API** (`https://mock.supabase.co/rest/v1/*` is intercepted with `page.route` and answered from an in-memory dummy dataset), so no real Supabase project or network access is needed.

```bash
# 1. Build against the mock URL
VITE_SUPABASE_URL=https://mock.supabase.co VITE_SUPABASE_ANON_KEY=dummy npx vite build --outDir /tmp/audit-dist

# 2. Serve it
npx vite preview --outDir /tmp/audit-dist --port 4173 --strictPort &

# 3. Run (needs `playwright` available; set CHROMIUM_PATH to use a preinstalled browser)
node docs/audit/harness/e2e.mjs        /tmp/audit-out   # 11 routes × desktop/mobile, a11y counters, SEO tags, blog-tag-filter request, tab order
node docs/audit/harness/responsive.mjs /tmp/audit-out   # 7 routes × 10 viewports (320→2560), overflow, CLS, long tasks, reduced motion
```

Outputs: `report.json`, `responsive.json` and screenshots in the output folder.

`e2e.mjs` also simulates a session for a GitHub account that is **not** the owner (fake token in `localStorage`) to show that `/admin` renders for any authenticated user (finding SEC-01).
