# Redesign plan: "Apple-clean" (mutugading.com design system → ilramdhan.dev)

> Status: draft for owner approval · Created 2026-11-23 · Ledger: [`STATE.md`](./STATE.md) · Resume: `/lanjut-redesign`
>
> Goal: ilramdhan.dev gets the **same typography, layout, UI/UX and motion** as mutugading.com, applied to a
> personal portfolio. Content, data layer and features stay. Only the presentation layer changes, plus the
> improvements listed in §6.

## 0. Sources of truth (read before any phase)

Reference repo: `$MG = /Users/ilhamramadhan/WebstormProjects/mutugading.com`.

| What | Where | Use |
|---|---|---|
| Design system (tokens, type ladder, rules, motion table) | `$MG/web/DESIGN.md` | **Binding.** Port it, then write our own `DESIGN.md` at the end (R12) |
| Tokens + utilities + keyframes | `$MG/web/src/app/globals.css` (869 lines) | Copy values verbatim (colors, radii, spacing, easing, type clamps) |
| Partials | `$MG/web/src/components/apple/*` | Port component by component (Next → Vite: `next/image` → our `Img`, `next/link` → `react-router` `Link`, drop `'use client'`, drop `next-intl`) |
| Motion engines | `$MG/web/src/components/interactive/*` | Port only those listed in §4 |
| Chrome | `$MG/web/src/components/layout/*` | Nav, mobile sheet, footer reveal, wordmark rise, theme toggle |
| Motion rationale | `$MG/plan/P12-MOTION.md`, `P12-MOTION-PLUS.md` | Why each animation exists, what was rejected |
| Skill procedures | `$MG/plan/SKILLS-USAGE.md` | **Binding**, same skill set, see §5 |
| Visual reference | run `$MG/web` (`bun run dev`) or `$MG/plan/screens/*.png`, `$MG/plan/concepts/apple-*.png` | Screenshot compare at 1440 and 375 |
| Existing i18n spec | `docs/PLAN.md` §3.5, T-40/T-41 | Used by I1/I2 (D5) |
| Our constraints | `docs/PLAN.md` §2 (Vite SPA + prerender, $0 free tier, Supabase rules), `CONTRIBUTING.md`, `HANDOVER.md` binding rules | Still apply |

## 1. Gap analysis (current → target)

| Area | Now (ilramdhan.dev) | Target (mutugading) | Decision |
|---|---|---|---|
| Framework | Vite + React 18 SPA + prerender | Next 16 + React 19 | **Stay on Vite** (owner decision PLAN §2.2). Port components, not the framework |
| CSS | Tailwind 3 (`tailwind.config.js`, slate palette, `darkMode: 'class'`) | Tailwind 4 `@theme` tokens + `@utility` type ladder | **R1 upgrades to Tailwind 4** (`@tailwindcss/vite`) so `globals.css` ports almost verbatim. Fallback if it blocks: tokens as CSS vars + TW3 `theme.extend` |
| Fonts | default Tailwind sans | system-ui / SF, Inter fallback, weights 600/400 | Same. Inter self-hosted (`@fontsource-variable/inter` or a woff2 in `public/`), no preload |
| Color | slate + indigo/violet glows (`.site-glow`), gradients, borders, cards | White / parchment / night tiles, one accent, no borders/cards/shadows/gradients | Same. Accent: see D1 |
| Layout | `max-w-7xl` sections with borders, card grids, `text-3xl font-bold` headings | Full-bleed `Tile`s, 0 gap, `.wrap` 1180px, type ladder (hero 40→80px) | Same |
| Dark mode | class toggle, light/dark | Light/Dark/Auto, no-flash head script, `data-theme`, tile-aware tokens | Same (keep our `ThemeContext` API, swap mechanism) |
| Motion | framer-motion (`Reveal`, `Stagger`, `GrowBar`, `MotionScope`), CSS marquee | GSAP + ScrollTrigger + Lenis, split-text, count-up, parallax, inset reveal, settle, stagger-row, scroll-fill, marquee w/ pause, view transitions, Flip, rolling digits | Port the subset in §4. Remove framer-motion at the end (R12) if nothing needs it |
| Hero | 3D lanyard card (R3F + rapier, lazy, desktop) | Photo hero tile + settle | See D2 |
| Nav | 64px navbar | 44px translucent bar, flyouts, brand-name collapse, full-screen mobile sheet, search icon | Same, scaled to our routes |
| Footer | simple | Parchment doormat footer + reveal curtain + wordmark rise | Same |
| Content units | ProjectCard, BlogCard, CertificateCard, TechBadge, carousels | "Linked group": `MediaFrame` + title + muted line + `LinkChevron`; `SpecRow`; `FeatureColumns`; `Disclosure` | Map in §3 |

## 2. Owner decisions (answered 2026-11-23, binding)

- **D1 Exact match:** typography, layout, UI/UX and motion are copied 1:1 from mutugading (same token values,
  incl. accent cobalt `#0A6499` / `#01AAEB` on dark tiles / `#2997FF` dark theme). Deviate only where a portfolio has no
  equivalent content, and record the deviation in STATE.md.
- **D2 Lanyard card:** live, interactive (physics) 3D card on **desktop only** (fine pointer, ≥1024px, motion allowed).
  On mobile/tablet it is **not rendered and not downloaded** (no poster either; the hero is text + photo like the
  reference). Reduced motion on desktop: same as mobile. Restyle to the neutral palette.
- **D3 Branch:** integration branch **`redesign/apple-clean`** (created from `origin/main` 7f7c54e). Phase branches
  `redesign/<phase>-<name>` → PR into it; final PR to `main` after owner approval of the Vercel preview.
  When first pushing: `git push -u origin redesign/apple-clean` (local branch currently tracks origin/main).
- **D4 Dependencies:** Tailwind **latest (4.x)** and every dependency to latest where it is a reasonable migration
  (phase R1). Anything held back is recorded with the reason in STATE.md "Holds".
- **D5 Multi-language:** **EN + ID**, as already specified in `docs/PLAN.md` §3.5 (EN at `/`, ID at `/id/...`,
  hreflang, `translations jsonb`, admin EN/ID tabs). Implements open issues **T-40 #55** and **T-41 #56**
  (close them from the phase PRs).

## 3. Page mapping (what each page becomes)

| Route | Tiles (top → bottom) | Motion (from §4 table) |
|---|---|---|
| `/` home | Hero tile (name h1, one lead line, pill "Contact" + chevron "Projects", D2 visual) · SpecRow (years, projects, posts, certificates: only real counts from DB, hide unknown) · Featured projects as FamilyRow of linked groups · Services as FeatureColumns (drop icon circles) · Tech stack as plain-text Marquee · Featured posts row · ScrollFill statement (from profile bio) · Closing night tile with ContactForm | hero entrance, settle (if photo), count-up, stagger-row, marquee, scroll-fill, split-text h2 |
| `/about` | Hero split (photo + bio) · Experience/education as Disclosure list or timeline rows · Skills SpecRow/FeatureColumns · WakaTime as quiet figures + GrowBar restyled · GitHub activity graph in MediaFrame · Certificates teaser row | split-text, count-up, stagger-row, parallax on portrait |
| `/projects` | Hero tile (h1 + lead) · segmented-control tag filter (parchment track, sliding thumb) · grid of linked groups · Pagination restyled | FlipGroup on filter, stagger-row, MediaFrame interactive zoom |
| `/projects/:slug` | Hero tile (title, lead, links as pill + chevron) · gallery: MediaFrame + Lightbox restyled · SpecRow (stack, year, role: only real fields) · article column 680px · related projects row · closing CTA tile | morph (card photo → hero, view transition), inset reveal, reading progress hairline |
| `/blog` | Hero tile · featured post as large split tile · tag filter segmented · article rows (Newsroom style) | stagger-row, FlipGroup |
| `/blog/:slug` | Newsroom article: 17px/680px column, TOC as Disclosure on mobile + sticky on desktop, ReadingProgress hairline under nav, ShareBar as chevron links, ArticleFooter | reading progress, TOC active marker slide, morph from list |
| `/certificates` | Hero tile · issuer segmented filter · linked groups (certificate image in MediaFrame) | FlipGroup, stagger-row |
| `/privacy`, `/terms` | Single white tile, article column | none |
| 404, RouteError, EnvErrorScreen, PageState | Centered screen tile, pill back home | hero entrance only |
| `/login`, `/admin/*` | **Tokens only** (fonts, colors, radii, fields, pills). No layout rebuild; admin is not public | none |

Skeletons (T-26, no CLS) must be re-done in the new shapes in the same phase as their page.

## 4. Motion inventory to port (and what stays out)

Port (each lazy, transform/opacity/clip-path only, still under reduced motion, CLS 0):
Lenis smooth scroll (fine pointer only) · Tile hero entrance (`animate-rise`, LCP image never starts at opacity 0) ·
TileHeading split-text (h2 only) · CountUp in SpecRow · MediaFrame `interactive` zoom 1.02 + SoftLight (links only) ·
MediaFrame `parallax` · MediaFrame `settle` (home hero only) · MediaFrame `reveal` inset clip (1–2 per page) ·
`.stagger-row` (translate only, never fade) · ScrollFill (one per page) · Marquee with Pause/Play (WCAG 2.2.2) ·
Disclosure height animation · RouteFade + morph via View Transitions API (fallback: none) · FlipGroup (filters) ·
nav brand-name collapse · footer reveal curtain + wordmark rise (with the P17 refresh fix) · PillButton press 0.98 +
LinkChevron nudge.

Do NOT port: magnetic buttons (removed in mutugading P13.1), particle hero, StackedCards/PhotoSequence (no process
content here), RollingDigits (no unit toggle), custom cursor, preloader, scroll-jacking.

Existing tests to keep green or update (not weaken): `e2e/motion.spec.ts`, `theme.spec.ts`, `navbar.spec.ts`,
`a11y.spec.ts`, `performance.spec.ts`, `prerender.spec.ts`, carousel specs (carousels become rows: rewrite those
specs to the new behaviour, keep the same intent).

## 5. How every phase runs (binding)

- **Orchestrator** (main session) reads STATE.md, dispatches one sub-agent per phase with the model below, verifies,
  updates STATE.md, reports to the owner in Bahasa Indonesia. Docs/code/prompts in English.
- **Model per task:** haiku = mechanical (inventory, screenshots, route sweeps, renames) · sonnet = page builds,
  QA, SEO · opus = foundation, motion engines, chrome, anything cross-cutting, final review.
- **Every UI sub-agent prompt must say:** load with the Skill tool `impeccable`, `design-taste-frontend`,
  `frontend-design`; read `~/.claude/skills/impeccable/reference/craft-floor.md` before editing; read
  `$MG/web/DESIGN.md` and the matching `$MG` component before writing ours (port, don't reinvent); motion work also
  loads `gsap-core`, `gsap-scrolltrigger`, `implement_lenis_scroll`; R3-F/3D work loads `threejs-react-three-fiber`;
  before editing a page, record its current animation/interaction inventory and prove each one still works (or is
  replaced per §4) after; at the end run `impeccable detect --json <changed files>`, taste checkers with a Chrome
  profile under `/tmp`, screenshots at 1440 and 375 in light and dark, compare against the matching mutugading
  screen, iterate ≥2 rounds; write files early; update only its own row + one log line in STATE.md.
- **Gates per phase:** `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build && npm run size`
  plus the e2e specs it touched (`npm run test:e2e -- <spec> --reporter=dot`). Full e2e in CI.
- **Git:** branch `redesign/<phase>-<name>` off `redesign/apple-clean`, Conventional Commits, PR into
  `redesign/apple-clean`, CI green before merge. Never skip/disable tests. Bundle budgets: may be raised only by the
  amount GSAP/Lenis add, recorded in the PR; public-route initial JS stays ≤180 KiB gzip.
- **Never:** invent content or numbers (unknown → hidden), touch Supabase prod schema, add borders/cards/shadows/
  gradients/eyebrow pills/icon circles/mono uppercase labels, second accent, hover zoom on non-link photos,
  parallax + zoom on the same photo.

## 6. Phases

| ID | Task | Model | Depends | Parallel with |
|---|---|---|---|---|
| **R0** | **Baseline:** screenshots of every public route 1440/375 light/dark → `docs/redesign/screens/before/`; Lighthouse mobile per route; bundle sizes (`npm run size -- --json`); animation inventory per page → `docs/redesign/inventory.md`; screenshot the matching mutugading pages → `screens/reference/` (run `$MG/web` with `bun run dev` on its own port) | haiku | – | — |
| **R1a** | **Dependency upgrade, staged, one commit per step, gates green after each:** (1) patch/minor (`npm update`); (2) React 19 + `@types/react*` 19 + R3F 9 + drei 10 + rapier 2 + three latest (they move together); (3) Vite 8 + `@vitejs/plugin-react` 6 + Vitest 5 + jsdom latest; (4) eslint 10 + `@eslint/js` + `globals` + react-hooks 7 + import-resolver 4 (fix new lint errors, don't disable rules); (5) react-router 8 (check prerender `StaticRouter` + `entry-server.tsx`); (6) lucide 1, sonner 2, tailwind-merge 3, jest-dom 8, Playwright latest (`CHROMIUM_PATH` in CONTRIBUTING), `@types/node` to the Node version Vercel uses. TypeScript 7: try; if typescript-eslint/vite tooling does not support it yet → hold on latest 5.x and record. framer-motion: **don't upgrade** (removed in R9). Run `npm audit`; also update `.github/dependabot.yml` ignores that block these majors | opus | R0 | — |
| **R1b** | **Foundation:** Tailwind 4 via `@tailwindcss/vite` (drop PostCSS/autoprefixer config, typography plugin via `@plugin`), port tokens, dark theme, type ladder `@utility`, radii, spacing, easing, keyframes from `$MG/web/src/app/globals.css`; tile-aware vars (`data-tone`); Inter self-hosted; no-flash theme script in `index.html` + Light/Dark/Auto in `ThemeContext`; remove `.site-glow`. Old pages must still render | opus | R1a | — |
| **R2** | **Partials** in `src/components/tile/` (one barrel): Tile, TileHeading, SpecRow, MediaFrame (on our `Img`, keeps width/height for CLS), PillButton, LinkChevron, ActionLink, FeatureColumns, LinkedGroup (= FamilyRow item), Disclosure/DisclosureGroup, FinePrint, SegmentedControl, restyled Field/Dialog/Pagination. Static only. One unit test file for Disclosure + SegmentedControl | opus | R1b | I1 |
| **I1** | **i18n UI (T-40 #55)** per `docs/PLAN.md` §3.5, with one change: instead of react-i18next, typed message dictionaries `src/i18n/messages/{en,id}.ts` (EN is the type source, ID must satisfy it → missing keys fail typecheck) + `useT()` / `useLocale()` + `localePath()`; ponytail: switch to i18next only if pluralisation/ICU needs grow. Locale routes (`/` and `/id/*`) in `routes.tsx` + prerender both locales + sitemap + hreflang/x-default + `og:locale` in `Seo` + `<html lang>`; `Intl` dates; zod/toast/aria strings from messages; first-visit "Baca dalam Bahasa Indonesia?" banner (no redirect). Strings only, no visual change (pages get restyled later and must use `t()`). Tests: unit check that `id` has every key; e2e `/id/` renders ID + hreflang present | sonnet | R1b | R2 |
| **R3** | **Motion layer:** add `gsap`, `@gsap/react`, `lenis`; port engines from `$MG/.../interactive/` per §4 into `src/components/motion/` (lazy `import()` near viewport, `gsap.matchMedia`, `useGSAP` cleanup); wire props into R2 partials; View Transitions route fade + morph (react-router `viewTransition`); dev-only `/__motion` preview route (not prerendered, not in sitemap); update `e2e/motion.spec.ts` + reduced-motion checks | opus | R2 | — |
| **R4** | **Chrome:** port `$MG` nav (44px translucent, brand collapse, flyouts only where a section has children, mobile full-screen sheet w/ focus trap stopping Lenis, theme toggle, **locale switch** EN/ID keeping the current page), footer (parchment doormat, link columns, socials as text links, version, locale names) + reveal curtain + wordmark rise (with P17 refresh fix); skip link; ScrollManager on Lenis. Update `navbar.spec.ts`, `theme.spec.ts`, `navigation.spec.ts` | opus | R3, I1 | — |
| **R5** | **Home** per §3 incl. skeletons + ContactForm restyle. Hero lanyard per D2: mount only when `matchMedia('(min-width:1024px) and (pointer:fine) and (prefers-reduced-motion:no-preference)')` matches (listen for changes), `import()` the hero-3d chunk only then; e2e: at 375px no `.glb`/hero-3d request, at 1440 the canvas mounts | opus | R4 | I2 |
| **I2** | **i18n content (T-41 #56):** migration `translations jsonb` (owner runs SQL; frontend works before and after, see HANDOVER rules), `localize()` helper in each feature `api.ts`, admin EN/ID tabs in `ResourceForm`, "Not yet translated" note, prerender + OG per locale, `npm run db:types` | sonnet | I1 | R5, R6* |
| **R6a** | **Projects:** `/projects` + `/projects/:slug` + ProjectCard → LinkedGroup, ImageCarousel/Lightbox restyle, morph | sonnet | R5 | R6b–d, I2 |
| **R6b** | **Blog:** `/blog` + `/blog/:slug` + FeaturedCarousel → featured split tile, article column, TOC, ReadingProgress, ShareBar, ArticleFooter, `prose` + hljs palette re-tokenised | sonnet | R5 | R6a, c, d, I2 |
| **R6c** | **About + Certificates** (WakaTime, GitHub graph, resume rows, CertificateCard) | sonnet | R5 | R6a, b, d, I2 |
| **R6d** | **Utility pages:** privacy, terms, 404, RouteError, EnvErrorScreen, PageState, login; admin tokens-only pass | haiku | R5 | R6a–c, I2 |
| **R7** | **QA gate:** full e2e green in **both locales** (rewrite selectors, keep assertions), axe on every route light+dark+EN+ID, keyboard pass, Lighthouse mobile ≥ R0 −3 per route (target ≥95), CLS 0, bundle budget, `web-design-guidelines` audit, `impeccable detect` 0 findings, taste `gate.mjs` PASS per route, side-by-side vs mutugading screenshots, ID copy long-string overflow check at 320px | sonnet | R6*, I2 | — |
| **R8** | **SEO/GEO recheck** with `seo`, `schema`, `ai-seo`, `geo-seo-claude`: one h1 per page, heading order, JSON-LD (`inLanguage`), hreflang pairs reciprocal, sitemap both locales, OG images re-themed, `llms.txt` if present | sonnet | R7 | — |
| **R9** | **Finish:** remove dead code (framer-motion, old motion components, `site-glow`, `tailwind.config.js`, postcss config), `impeccable document` → root `DESIGN.md`, update `docs/architecture.md`, README, CONTRIBUTING; `/code-review high` on `redesign/apple-clean` vs `main`; final PR to `main` with before/after screenshots | opus | R8 | — |

Shipping rule: `redesign/apple-clean` → `main` only after R9 and owner approval of the Vercel preview.

## 7. Improvements folded in (only where they ride along)

- Light/Dark/**Auto** theme with no-flash script (today: two-state toggle).
- View-transition continuity card → detail on projects and blog.
- Marquee pause control (WCAG 2.2.2) and 44px targets everywhere (WCAG 2.5.8).
- Reading progress + TOC active marker for project detail too (already on blog).
- Fewer dependencies at the end: framer-motion out, GSAP + Lenis in (net JS roughly flat; measure in R3 and R9).

Skipped on purpose: command-palette search (portfolio has `lib/search.ts` filters already; add when content
volume needs it), new 3D scenes, RFQ-like flows.
