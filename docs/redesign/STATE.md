# Redesign ledger (update after every phase; the next session starts here)

Plan: [`PLAN.md`](./PLAN.md). Reference repo: `/Users/ilhamramadhan/WebstormProjects/mutugading.com`.
Integration branch: `redesign/apple-clean` (from origin/main 7f7c54e; push with `git push -u origin redesign/apple-clean`).

## Decisions (PLAN §2, answered by owner 2026-11-23)

| ID  | Answer                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------ |
| D1  | Exact 1:1 match with mutugading (tokens, type, layout, UI/UX, motion, accent)                          |
| D2  | Lanyard 3D live on desktop only (≥1024, fine pointer, motion ok); mobile: not rendered, not downloaded |
| D3  | Branch `redesign/apple-clean` from origin/main 7f7c54e (created locally, not pushed yet)               |
| D4  | Tailwind latest (4.x) + all deps latest where reasonable (R1a); holds recorded below                   |
| D5  | EN + ID (T-40 #55, T-41 #56) via phases I1, I2                                                         |

## Holds (deps not upgraded, with reason)

- framer-motion: removed in R9, not upgraded. Runs on React 19 via a peer override + type shim (`src/types/framer-motion-react19.d.ts`, listed first in tsconfig `include`); delete both in R9.
- TypeScript 7: typescript-eslint 8.73 supports TS <6.1 only → on TS 6.0.3.
- @types/node: 22.x to match Node 22 (CI, Vercel); not 26.
- eslint-plugin-jsx-a11y 6.10: no ESLint 10 peer yet (works) → peer override in package.json.

## Phases

| ID  | Status | PR   | Notes                                                                                                                 |
| --- | ------ | ---- | --------------------------------------------------------------------------------------------------------------------- |
| R0  | ✅     |      | baseline.md, inventory.md, screens/before (40), screens/reference (32); 404 not Lighthouse-measurable                 |
| R1a | ✅     | #163 | React 19, R3F 9, Vite 8, Vitest 5, ESLint 10, router 8, Playwright 1.65, TS 6; holds below; CI green (735 e2e)        |
| R1b | ✅     | #164 | TW 4.3 (@tailwindcss/vite), MG tokens/type/dark/Auto, Inter self-hosted, CSS budget 19.5; CI green                    |
| R2  | ✅     | #165 | tile partials (static, R3 hooks as data-*), Field/Dialog/Pagination restyled; CSS budget 20.5; CI green               |
| I1  | ✅     | #166 | typed en/id dicts, /id routes + prerender + hreflang + sitemap, banner; id dict lazy; CI green                        |
| R3  | ✅     | #167 | GSAP 3.15 + Lenis lazy (48.4 KiB), ViewTransition route fade, /__motion dev-only; CI green                            |
| R4  | ✅     | #168 | 44px nav + brand collapse, sheet (trap, Lenis stop), doormat + wordmark rise (P17), skip link, Lenis scroll; CI green |
| R5  | ✅     | #170 | home tiles + D2 lanyard gate (idle boot, long tasks 3), ContactForm focus-visible; home 143 KiB; JS total 1640        |     |
| I2  | ✅     | #169 | translations jsonb (owner SQL pending), localize(), admin EN/ID tabs, lazy api.ts; works pre/post migration           |     |
| R6a | ⬜     |      |                                                                                                                       |
| R6b | ⬜     |      |                                                                                                                       |
| R6c | ⬜     |      |                                                                                                                       |
| R6d | 🟡     |      | privacy/terms/404 tiles, error screens + PageState, LocaleBanner, admin/login tokens; footer-click check; screens/R6d; awaiting PR |
| R7  | ⬜     |      |                                                                                                                       |
| R8  | ⬜     |      |                                                                                                                       |
| R9  | ⬜     |      |                                                                                                                       |

Legend: ⬜ todo · 🟡 partial (finish, don't restart) · ✅ done + verified by orchestrator.

## Gotchas (append as found)

- mutugading's taste checkers crash the dev server if the Chrome profile is inside the repo: use `/tmp`.
- Footer wordmark rise needs ScrollTrigger refresh after late layout (mutugading P17).

- Home long tasks at 4x CPU: fixed in R5 (3D card boots after load + idle): 3 in 9/10 runs, limit 5.
- **Import partials by module, not the barrel** (`@/components/tile/X`, `@/components/motion/X`) from anything in the entry chunk (chrome, shared cards): a barrel import there hoists every partial into `index.js` for all routes (R5: privacy +3.6 KiB).
- Feature `queries.ts` lazy-import their `api.ts` (I2) to keep localize/translations retry out of initial JS.

### CI failures (read before opening a PR)

- **Time-dependent e2e: local green ≠ CI green.** CI builds `dist-e2e` once and the matrix runs ~9–11 min, so prerendered data is older than React Query `staleTime` (5 min) for later specs; locally the build is seconds old. Anything that depends on data age (refetch on mount, idle refresh in `src/lib/prerendered-data.ts`) only breaks in CI. I1 hit this: stale seed → mount refetch + idle `invalidateQueries` cancelled it and fetched again → `data-layer.spec.ts` "profile is fetched once" saw 2 requests (fixed: refresh only queries still holding build data, `cancelRefetch: false`). To reproduce locally, make the seed stale (e.g. `vi.useFakeTimers` in a unit test, or wait > 5 min after `npm run test:e2e` builds before rerunning with `--no-deps`/reuse).
- **Don't dismiss an e2e failure as a flake** because it passes alone. A failure that also fails its retry (`retry #1`) in CI is real. Sub-agents must report it, not label it timing.
- **Run touched specs on `desktop` and `tablet` projects**, not only `desktop`; CI runs the full width matrix.
- **Merge `origin/redesign/apple-clean` into the phase branch before the PR** when a parallel phase merged first (R2+I1 pattern), then rerun gates.
- **Read real exit codes.** `cmd | tail` returns tail's exit code; check `N failed` in the output, or redirect to a file and `echo exit=$?`. `npm test` can print `Errors N` under load while still exiting 0 through a pipe: rerun alone.
- **`gh pr merge` can hang** waiting on stdin in this harness: run it with `</dev/null`, then confirm with `gh pr view N --json state`.

## Log (one line per event, newest last)

- 2026-11-23 Plan written (analysis of both repos). Waiting for D1–D5.
- 2026-11-23 D1–D5 answered; branch redesign/apple-clean created; plan updated (R1 split into R1a deps + R1b foundation, i18n phases I1/I2 added). Next: R0.
- 2026-11-23 R0 done: baseline captured (home perf 61 / LCP 5.5s is the weak spot), verified by orchestrator. Next: R1a.
- 2026-11-23 R1a: deps upgraded on redesign/R1a-deps (React 19, R3F 9, Vite 8, Vitest 5, ESLint 10, router 8, Playwright 1.65, TS 6); holds recorded; PR into redesign/apple-clean, awaiting orchestrator verify.
- 2026-11-23 R1a ✅ merged #163 (verified by orchestrator: npm ci on npm 10, gates green, CI green); also charts chunk kept off home + cached Intl formatter. Next: R1b.
- 2026-11-23 R1b on redesign/R1b-foundation: Tailwind 4 + mutugading tokens verbatim, `white` = page surface (literal whites → `on-dark`), Light/Dark/Auto via data-theme + no-flash script (CSP hash updated), tailwind-merge 3, .site-glow removed; screens/R1b; awaiting orchestrator verify.
- 2026-11-23 R1b ✅ merged #164 (verified by orchestrator: gates green, screens/R1b checked, CI green incl. full e2e). Deferred to R2–R4: MG CSS for Disclosure/footer/scroll-fill/settle/stagger/inset/view transitions/brand collapse. Next: R2 + I1 in parallel.
- 2026-11-24 R2 ✅ merged #165 (verified by orchestrator: gates green, screens/R2 checked, CI green; CSS budget 19.5 → 20.5 KiB). I1 ✅ #166 (verified: gates, e2e i18n/prerender/seo/data-layer; CI e2e failed once on a stale-seed double profile fetch, fixed in prerendered-data.ts, see Gotchas). Follow-up: Pagination aria-labels to messages. Next: R3.
- 2026-11-24 R3 ✅ merged #167 (verified by orchestrator: gates green, screens/R3 checked vs reference home, full e2e 789 local, CI green). Budgets JS 1630 / CSS 21.5 / projects 161. Fixed: SSR ViewTransition CSP inline scripts, Lenis keyboard focus. Next: R4.
- 2026-11-24 R4 on redesign/R4-chrome: mutugading chrome ported (44px nav + brand collapse, no flyouts, Light/Dark/Auto menu, EN/ID same-page switch, mobile sheet w/ focus trap + Lenis stop, parchment doormat + reveal curtain + lazy wordmark rise w/ P17 refresh, skip link, ScrollManager on Lenis, Pagination labels via t()); nav/main moved into PublicLayout; Dialog portalled to body; budgets CSS 22.5 / privacy 132 / blog 138 / projects 164 / home 157; screens/R4; awaiting orchestrator verify.
- 2026-11-24 R4 ✅ merged #168 (verified by orchestrator: gates green, full e2e 820 local, screens/R4 nav 1440 + footer 375 checked vs reference, CI green). Budgets CSS 22.5 / home 157 / privacy 132 / blog 138 / projects 164. Fixed along: AdminRoute non-admin redirect, Lenis hash scroll cut short, locale link hash after hydration. Left for R5: ContactForm focus ring; R6d: admin .btn-secondary gray-on-color (impeccable). Local `npm test`/format pick up untracked `.claude/worktrees/`: exclude or delete them. Next: R5 + I2 in parallel.
- 2026-11-24 I2 ✅ merged #169 (verified by orchestrator: gates, e2e 182 desktop+tablet, CI green; fixed a pre-migration e2e race + /projects budget via lazy api.ts). **Owner: run `supabase/migrations/20261124000000_translations_jsonb.sql` in the SQL Editor, then record the version.** R5 ✅ #170 (verified: gates, full e2e desktop+tablet 373, screens/R5 1440+375 vs reference; Footer barrel import fixed, JS total 1630→1640 for lazy motion engines only; TOC e2e now measures the nav). Follow-ups: R4 footer curtain slows footer-link clicks from scrolled pages (~10s in Playwright); indigo classes in ArticleFooter/ShareBar/Carousel/LocaleBanner (R6). Next: R6a–R6d in parallel.
- 2026-11-24 R6d on redesign/R6d-utility: privacy/terms/404 as screen tiles (inlined Tile classes, no tile partial in the entry chunk: privacy 128.9 KiB, home 142.8); error screens + PageState on tokens; LocaleBanner, admin, login indigo -> MG tokens; .btn-secondary text-ink on parchment. Footer-click root cause: the reveal curtain (z 2) covers the sticky footer (z 1) until the page is near the bottom; clicks from 30-60% scroll wait for the lift (2-6 s), working as designed; the new e2e check scrolls to the bottom first and clicks with 3 s timeout (desktop + tablet). Gates: typecheck/lint/format:check/test/build/size exit 0; e2e navigation+smoke+a11y+theme+navbar+i18n+admin+admin-crud desktop+tablet 99 passed, 0 failed. impeccable detect: 2 findings left, both global.css font stack (R1b, not ours). Next: orchestrator verifies, merges.
