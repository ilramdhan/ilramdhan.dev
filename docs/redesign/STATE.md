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
- tailwind-merge 3: supports Tailwind 4 only → stays 2.6 until R1b.
- @types/node: 22.x to match Node 22 (CI, Vercel); not 26.
- eslint-plugin-jsx-a11y 6.10: no ESLint 10 peer yet (works) → peer override in package.json.

## Phases

| ID  | Status | PR  | Notes                                                                                                                 |
| --- | ------ | --- | --------------------------------------------------------------------------------------------------------------------- |
| R0  | ✅     |     | baseline.md, inventory.md, screens/before (40), screens/reference (32); 404 not Lighthouse-measurable                 |
| R1a | 🟡     |     | branch redesign/R1a-deps, 8 commits; all gates + full local e2e (735) green; holds below; PR open, awaiting CI/verify |
| R1b | ⬜     |     |                                                                                                                       |
| R2  | ⬜     |     |                                                                                                                       |
| I1  | ⬜     |     |                                                                                                                       |
| R3  | ⬜     |     |                                                                                                                       |
| R4  | ⬜     |     |                                                                                                                       |
| R5  | ⬜     |     |                                                                                                                       |
| I2  | ⬜     |     |                                                                                                                       |
| R6a | ⬜     |     |                                                                                                                       |
| R6b | ⬜     |     |                                                                                                                       |
| R6c | ⬜     |     |                                                                                                                       |
| R6d | ⬜     |     |                                                                                                                       |
| R7  | ⬜     |     |                                                                                                                       |
| R8  | ⬜     |     |                                                                                                                       |
| R9  | ⬜     |     |                                                                                                                       |

Legend: ⬜ todo · 🟡 partial (finish, don't restart) · ✅ done + verified by orchestrator.

## Gotchas (append as found)

- mutugading's taste checkers crash the dev server if the Chrome profile is inside the repo: use `/tmp`.
- Footer wordmark rise needs ScrollTrigger refresh after late layout (mutugading P17).

## Log (one line per event, newest last)

- 2026-11-23 Plan written (analysis of both repos). Waiting for D1–D5.
- 2026-11-23 D1–D5 answered; branch redesign/apple-clean created; plan updated (R1 split into R1a deps + R1b foundation, i18n phases I1/I2 added). Next: R0.
- 2026-11-23 R0 done: baseline captured (home perf 61 / LCP 5.5s is the weak spot), verified by orchestrator. Next: R1a.
- 2026-11-23 R1a: deps upgraded on redesign/R1a-deps (React 19, R3F 9, Vite 8, Vitest 5, ESLint 10, router 8, Playwright 1.65, TS 6); holds recorded; PR into redesign/apple-clean, awaiting orchestrator verify.
