# Improvement Plan & Design Spec — ilramdhan.dev

> **Status:** Approved direction · **Created:** 2026-10-10 · **Source of findings:** [`docs/audit/AUDIT.md`](./audit/AUDIT.md)
>
> This is the working spec for the next AI (or human) sessions. It says **what to build, in which order, how, and how to prove it's done**. Each task `T-xx` has a GitHub issue (see [§9 Issue index](#9-issue-index)). Work one task per branch/PR.

---

## 1. How to use this document (read first, every session)

1. Read §2 (constraints & decisions) and §3 (target architecture) once.
2. Pick the **lowest-numbered open task** whose dependencies are closed (§5). Quick wins marked ⚡ can be picked any time.
3. Open its GitHub issue, read the linked audit IDs in `AUDIT.md`.
4. Branch: `<type>/T-xx-short-name` (e.g. `fix/T-18-blog-tag-filter`). Conventional Commit messages (`fix(blog): pass tag to getBlogs`).
5. Follow the task's **Steps**, satisfy every **Acceptance criterion**, run the **Verification** commands (§6).
6. PR title `T-xx: <title>`, body uses the PR template and `Closes #<issue>`. Update the checkbox in the tracking issue.
7. Never mix tasks in one PR. Never weaken RLS, tests or lint rules to make something pass.
8. If a decision is needed that this spec doesn't cover, ask the owner instead of guessing; record the answer in §2.

---

## 2. Constraints & decisions

### 2.1 Hard constraints (free tier)

| Service           | Limit that matters                                                                                                            | Design consequence                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel Hobby**  | Static hosting + serverless/edge functions, build minutes, 100 GB bandwidth/mo, non-commercial use                            | Prefer build-time work (prerender, OG images, sitemap) over runtime functions; keep functions tiny.                                           |
| **Supabase Free** | 500 MB DB, **1 GB Storage**, 5 GB egress/mo, **project pauses after ~7 days inactive**, no PITR, **no image transformations** | Compress images in the browser before upload; delete orphan files; prerender so the site survives a paused DB; schedule keep-alive + backups. |
| **Cost**          | Must stay $0                                                                                                                  | Only free tiers: Cloudflare Turnstile, Resend free / Telegram bot, GitHub Actions, UptimeRobot, Vercel Analytics (Hobby).                     |

### 2.2 Owner decisions (2026-10-10)

| Topic       | Decision                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Rendering   | **Stay on Vite + React SPA**, add **build-time prerendering (SSG)** for all public routes. No framework migration.        |
| i18n        | **UI + content in English and Indonesian.** English stays at the current URLs (no prefix), Indonesian under `/id/...`.    |
| 3D / Vanta  | **Keep the 3D lanyard card**, but optimized and lazy (home, desktop, motion allowed). **Remove Vanta**; replace with CSS. |
| Auth        | Supabase sign-ups are **OFF** (keep it off). Still implement admin allowlist (defense in depth).                          |
| Admin login | GitHub OAuth stays.                                                                                                       |

### 2.3 Engineering principles

- **Security in the database, not the UI.** Every write is authorized by RLS (`is_admin()`), UI checks are UX only.
- **Static first.** Anything that can be computed at build time is.
- **Progressive enhancement.** Content readable without JS; 3D/motion are extras that respect `prefers-reduced-motion`.
- **One source of truth.** Types generated from the DB; zod schemas shared by forms and API; one `<Seo>`; one motion config.
- **Small PRs, always green CI.**

---

## 3. Target architecture

### 3.1 Directory layout (after T-14)

```
.
├── src/
│   ├── main.tsx                 # entry (SSG entry exported for prerender)
│   ├── app/
│   │   ├── routes.tsx           # route objects (lazy), locale-aware
│   │   ├── providers.tsx        # QueryClient, Auth, Theme, I18n, MotionConfig, Helmet
│   │   ├── layouts/             # PublicLayout (header/nav/main/footer), AdminLayout
│   │   └── error/               # RouteError, NotFound
│   ├── pages/                   # thin route components: home, about, projects, project-detail, blog, blog-detail, certificates, legal, login, admin/*
│   ├── features/
│   │   ├── profile/             # api.ts, queries.ts, schema.ts, components/
│   │   ├── projects/
│   │   ├── blog/                # + comments/
│   │   ├── certificates/
│   │   ├── resume/
│   │   ├── services/
│   │   ├── tech-stack/
│   │   ├── messages/
│   │   ├── hero-3d/             # lazy chunk: Canvas, Band, assets loader
│   │   └── wakatime/
│   ├── components/
│   │   ├── ui/                  # Button, Field, Dialog, Pagination, Skeleton, EmptyState, ErrorState, Tag, Card
│   │   ├── motion/              # Reveal, Stagger, PageTransition
│   │   ├── seo/                 # Seo, JsonLd
│   │   └── markdown/            # Markdown renderer (gfm, slug, highlight)
│   ├── lib/                     # supabase client, env, errors, slugify, upload, image-compress, date, utils
│   ├── i18n/                    # config, locales/en/*.json, locales/id/*.json
│   ├── config/site.ts           # name, urls, social defaults, wakatime ids
│   ├── styles/global.css
│   └── types/database.ts        # GENERATED by `npm run db:types`
├── scripts/                     # build-time: prerender routes list, og-images, sitemap, rss
├── supabase/
│   ├── config.toml
│   ├── migrations/              # timestamped SQL, never edited after merge
│   └── seed.sql                 # dummy data for local dev & e2e
├── api/                         # Vercel functions (only if needed: contact/comment submit)
├── e2e/                         # Playwright specs + supabase mock fixtures
├── public/
├── docs/                        # PLAN.md, audit/, architecture.md, ADRs
└── .github/                     # workflows, templates, dependabot
```

### 3.2 Request / render flow

```
Build (Vercel):
  vite build ──▶ SSG step: for each public route × locale
                   └─ loader fetches data from Supabase (anon key, read-only)
                   └─ renderToString ▶ dist/<locale>/<route>/index.html  (full <head>: title, canonical, OG, hreflang, JSON-LD)
               ──▶ scripts: og-images (satori ▶ dist/og/*.png), sitemap.xml, rss.xml, 404.html
Runtime:
  Browser gets static HTML (fast LCP, crawlable) ─▶ hydrate ─▶ React Query seeded with loader data
         ─▶ background refetch (staleTime 5 min) ─▶ lazy chunks: hero-3d (home/desktop/idle), admin (on /admin)
Content change:
  Admin saves in dashboard ─▶ Supabase DB webhook (blogs/projects/certificates/profile/...) ─▶ Vercel Deploy Hook ─▶ rebuild (~1–2 min)
  (Until rebuild finishes, hydrated pages already show fresh data via client fetch.)
```

### 3.3 Auth & authorization model

- Single owner. Table `public.admin_users(user_id uuid primary key references auth.users)` seeded with the owner's id.
- `public.is_admin()`:
  ```sql
  create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = '' as $$
    select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
  $$;
  revoke all on function public.is_admin() from public;
  grant execute on function public.is_admin() to anon, authenticated;
  ```
- Policies (all content tables): `select` → public (blogs: `status = 'published' and published_at <= now()` **or** `is_admin()`); `insert/update/delete` → `using (public.is_admin()) with check (public.is_admin())`.
- `messages`: no public select; inserts only through the anti-spam function (T-11) using the service role, or `anon insert` with constraints if T-11 is deferred; select/update/delete → `is_admin()`.
- `blog_comments`: public select of `is_approved = true`; insert via anti-spam function; moderation → `is_admin()`.
- Storage bucket `ilramdhan.dev`: public read; insert/update/delete → `is_admin()`; bucket `allowed_mime_types` + `file_size_limit`.
- Frontend: `useIsAdmin()` (calls `rpc('is_admin')` once, cached) → `AdminRoute` redirects non-admins to `/` with a toast and signs them out.

### 3.4 Data layer

- `features/<x>/api.ts`: typed Supabase calls selecting explicit columns per view (`listCard`, `detail`, `admin`).
- `features/<x>/queries.ts`: `queryOptions()` factories with hierarchical keys: `['projects','list',{page,tag,locale}]`, `['projects','detail',slug,locale]`.
- `lib/errors.ts`: `toAppError(postgrestError)` → `NotFoundError` (PGRST116), `AuthError`, `ValidationError`, `NetworkError`.
- QueryClient defaults: `staleTime: 5 * 60_000`, `gcTime: 30 * 60_000`, `refetchOnWindowFocus: false`, `retry: 1` (0 for 4xx).
- zod schemas in `features/<x>/schema.ts` used by admin forms (react-hook-form + zodResolver) and by API input mapping.

### 3.5 i18n design (T-40, T-41)

- Library: `react-i18next` + `i18next` (namespaces: `common`, `home`, `about`, `projects`, `blog`, `certificates`, `admin`, `legal`). Resources are bundled per locale and lazy-loaded.
- Locales: `en` (default, no URL prefix), `id` (prefix `/id`). Route objects are generated for both: `/blog/:slug` and `/id/blog/:slug`.
- Detection order for first visit to `/`: saved preference → `navigator.language` starts with `id` → show a non-blocking "Baca dalam Bahasa Indonesia?" banner (no auto-redirect, so crawlers and shared links stay stable).
- `<html lang>` and `dir` set per locale; `<link rel="alternate" hreflang="en|id|x-default">` on every page; `og:locale` + `og:locale:alternate`.
- **Content model:** base columns stay English (no data migration needed). Add `translations jsonb not null default '{}'` to `profile`, `projects`, `blogs`, `services`, `resume`, `certificates`:
  ```json
  { "id": { "title": "…", "short_description": "…", "content": "…" } }
  ```
  Read helper `localize(row, locale, fields)` falls back to the base column when a translation is missing (and the page shows a small "Not yet translated" note). Slugs are shared across locales.
- Admin: each translatable form shows **EN | ID** tabs; ID fields write into `translations.id`.
- Dates/numbers via `Intl.DateTimeFormat(locale)`; all UI strings (including `aria-label`s, toasts, validation messages) come from i18n.

### 3.6 Performance budget

| Asset                               | Budget (gzip)                                                   |
| ----------------------------------- | --------------------------------------------------------------- |
| Initial JS for any public route     | ≤ 180 KB (CI: `/privacy` ≤ 105, `/blog` ≤ 120, `/` ≤ 190, T-58) |
| Route chunk                         | ≤ 60 KB                                                         |
| `hero-3d` chunk (lazy)              | ≤ 350 KB + model ≤ 400 KB                                       |
| Admin chunk (lazy)                  | ≤ 250 KB                                                        |
| CSS                                 | ≤ 25 KB                                                         |
| Lighthouse mobile (home, blog post) | Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO = 100            |
| CLS                                 | < 0.1 at every viewport in the matrix                           |

Enforced in CI with `size-limit` (or a small script over `dist/assets`) and Lighthouse CI against the Vercel preview.

Since T-58 the Supabase client and the markdown parser are loaded on first use, not on the critical path. CI budgets are the measured size plus ~15–20% headroom; `npm run analyze` shows the treemap and PR builds diff sizes against `main` in the job summary.

### 3.7 Responsive matrix

Every UI PR is checked at **320, 360, 390, 414, 768, 1024, 1280, 1440, 1920, 2560 px** (Playwright project per width), light + dark, plus `prefers-reduced-motion: reduce`. Rules:

- No horizontal document scroll at any width.
- Navbar collapses below `lg` (1024 px).
- 3D card only at `lg+`; below `lg` show a static image of the card (or nothing) **below** the hero copy.
- Long words: `break-words` on titles; `pre`, tables and embeds in `overflow-x-auto`.
- Touch targets ≥ 44×44 px on touch layouts.
- Content max width ~72ch for reading pages; wide screens (≥1920) keep `max-w-7xl` but scale hero typography with `clamp()`.

### 3.8 Motion system (T-29 … T-32)

- Library: `motion` (successor of framer-motion; same API) — upgrade during T-29 if it doesn't drag React 19 in; otherwise keep framer-motion 10/11 and upgrade in T-56.
- Root `<MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>`.
- Tokens: `duration.fast = 0.15`, `base = 0.3`, `slow = 0.5`; distance `y: 16`; stagger `0.06`, max total stagger `0.4s`.
- Only animate `opacity` and `transform` (never `width/height/filter/blur` on large areas).
- `Reveal` (fade-up, `viewport={{ once: true, amount: 0.2 }}`), `Stagger` (parent variants), `PageTransition` (fade 150–200 ms; View Transitions API where supported).
- CSS animations wrapped in `motion-safe:`; marquee pauses on hover/focus and when off-screen; WebGL paused off-screen.
- Micro-interactions catalogue (T-32): animated active-nav pill (`layoutId`), navbar compact/blur after 16 px scroll, theme toggle with View-Transition circular reveal + icon rotate, carousel crossfade + swipe + keyboard, skill/Wakatime bars animate from 0 on view, number counters for stats, button `active:scale-[0.98]`, shimmer skeletons, toast enter/exit consistent.

---

## 4. Detailed designs for the risky parts

### 4.1 Prerendering (T-35)

- **Preferred:** `vite-react-ssg` (SSG for React Router data routes). Requirements: route objects with `loader`s, no `window`/`document` at module scope (3D, Wakatime, theme script are client-only), `Helmet` (`react-helmet-async`) for head tags.
- Route list at build: static routes + `select slug from projects`, `select slug from blogs where published` (anon key), × locales.
- Loader data seeds React Query (`initialData`) to avoid a client refetch flash.
- **Fallback** if `vite-react-ssg` blocks: post-build script that renders each route with `react-dom/server` `renderToString` using a separate SSR entry (Vite `build --ssr`), writing `dist/<route>/index.html`.
- Deploy hook: Supabase → Database → Webhooks on `insert/update/delete` of `blogs, projects, certificates, services, resume, tech_stack, profile` → `POST https://api.vercel.com/v1/integrations/deploy/<hook>`; store the hook URL only in Supabase.
- `vercel.json`: keep SPA fallback for `/admin*` and unknown routes → `404.html` for unknown public routes.

### 4.2 OG images (T-36)

- Build script `scripts/og.ts`: `satori` (JSX → SVG) + `@resvg/resvg-js` (SVG → PNG), 1200×630, brand template (name, title, tags, logo), output `dist/og/{default,blog/<slug>,projects/<slug>}.png` (+ `-id` variants when title differs).
- `<Seo>` emits `og:image`, `og:image:width=1200`, `og:image:height=630`, `og:image:alt`, `twitter:card=summary_large_image`, `twitter:image`. All URLs absolute (`site.url`).
- Admin may override with an uploaded cover (`og_image_url` column) — optional.

### 4.3 `<Seo>` component (T-33)

Props: `title`, `description`, `path`, `image`, `type` (`website|article|profile`), `publishedTime`, `modifiedTime`, `tags`, `noindex`, `jsonLd[]`. Emits title (`%s | Ilham Ramadhan`), description, canonical (`site.url + localePrefix + path`), robots, OG/Twitter, hreflang alternates, JSON-LD. Used by every page; `/login`, `/admin/*`, 404 use `noindex`.

### 4.4 3D card (T-25)

- `gltf-transform optimize card.glb card.min.glb --compress meshopt --texture-compress webp` (+ resize textures ≤ 1024 px). Target ≤ 400 KB. Keep the source in `assets-src/` (not served).
- `features/hero-3d/HeroCard.tsx` loaded with `React.lazy` **only** when: route is home, viewport ≥ 1024 px, `prefers-reduced-motion: no-preference`, WebGL available; mounted after `requestIdleCallback`/`load`.
- Static `card-poster.webp` placeholder at the same position (no CLS); swap in when the canvas is ready.
- `<Canvas dpr={[1, 1.5]} frameloop={inView ? 'always' : 'never'}>`; physics paused off-screen; pointer events enabled on the card region only.
- Delete `components/band.tsx`; one typed `Band` generated with `gltfjsx --types`.

### 4.5 Anti-spam (T-11)

- Cloudflare Turnstile widget on contact + comment forms.
- Vercel Function `api/submit.ts` (or Supabase Edge Function): verify Turnstile token, validate with zod, per-IP rate limit (simple: Supabase table `rate_limits(ip_hash, bucket, count, window_start)`), insert with the service-role key (server env only), return generic errors.
- RLS: revoke anon INSERT on `messages`/`blog_comments` after the function is live.
- Comments: `is_approved boolean default false`; public select only approved; admin moderation UI (T-49).

### 4.6 Admin CRUD abstraction (T-17)

```ts
const projectsResource = defineResource({
  key: 'projects',
  table: 'projects',
  schema: projectSchema,
  columns: { list: 'id,title,slug,images,is_featured', edit: '*' },
  storageFolder: 'projects',
});
// useCrudResource(projectsResource) -> { list, create, update, remove, isPending }
// <ResourceForm resource fields={[{name:'title', kind:'text', i18n:true}, {name:'content', kind:'markdown', i18n:true}, {name:'images', kind:'images'}]} />
```

All tabs become config + a few custom fields. Delete confirmation, toasts, optimistic list updates and storage cleanup live in one place.

---

## 5. Phased task list

Legend: **Deps** = must be merged first · ⚡ = quick win, can be done any time · Sev from audit.

### Phase 0 — Foundation & safety net

#### T-01 Fix ESLint, add Prettier & EditorConfig — `ARCH-05`

- **Steps:** ESLint 9 flat config (`typescript-eslint`, `eslint-plugin-react-hooks`, `react-refresh`, `jsx-a11y`, `import`), Prettier + `eslint-config-prettier`, `.editorconfig`, scripts `lint`, `lint:fix`, `format`. Fix or explicitly disable (with TODO + issue link) existing violations.
- **AC:** `npm run lint` exits 0 with `--max-warnings 0`; `npm run format -- --check` passes.

#### T-02 Remove dead code & unused dependencies; fix prod vulnerabilities — `ARCH-02`, `SEC-07` ⚡

- **Steps:** delete `components/band.tsx`, `app/layout.tsx`, `experimental/`, `metadata.json`, `public/next.svg`, `public/vercel.svg`, `public/assets/images/{front,back}.png` and `public/logo/ir-*-nav.png` (after confirming the DB `logo_url` doesn't use them), `delay()`, `submitContactForm`; uninstall `next-themes`, `class-variance-authority`, `@supabase/ssr`, `@types/recharts`; move `@vercel/node` to devDependencies or remove with T-13; bump `react-router-dom` to latest 6.x; `npm audit fix` (non-breaking).
- **AC:** `npm audit --omit=dev` shows 0 critical/high; build size not larger; app behaves the same (e2e smoke once T-05 exists).

#### T-03 TypeScript strict mode + generated Supabase types — `ARCH-04` · Deps: T-04

- **Steps:** `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`; drop `allowJs`, `experimentalDecorators`, `useDefineForClassFields`; `npm run db:types` → `supabase gen types typescript --local > src/types/database.ts`; remove all `any`/`@ts-ignore` or justify each.
- **AC:** `tsc --noEmit` passes; no `any` without an eslint-disable comment and reason.

#### T-04 Supabase CLI migrations, seed data, constraints & indexes — `ARCH-08`, `SEC-08`, `PERF-08`

- **Steps:** `supabase init`; baseline migration reproducing current prod schema + policies (from `schema.sql` + `supabase-fix.sql`, without `DROP`); new migration: enums (`resume_type`), `CHECK (char_length(...))`, `NOT NULL` where required, `updated_at` + trigger, indexes (`projects(is_featured, created_at desc)`, `blogs(published_at desc)`, GIN on `tags`, `blog_comments(blog_id)`, `certificates(issued_date desc)`); `seed.sql` with dummy content (reuse `docs/audit/harness` dataset); move old SQL files to `supabase/legacy/` with a README.
- **AC:** `supabase start && supabase db reset` gives a working local DB; the app runs fully against it with `.env.local` pointing to local; README documents it.

#### T-05 Test infrastructure: Vitest + Playwright (mocked Supabase) + axe — `ARCH-06` · Deps: T-01

- **Steps:** Vitest + Testing Library + jsdom for units; Playwright with projects for the responsive matrix (§3.7) + reduced-motion; a `supabaseMock` fixture (port from `docs/audit/harness/e2e.mjs`) and an optional mode that runs against local Supabase; `@axe-core/playwright`; smoke specs for every public route + admin gate.
- **AC:** `npm test` and `npm run test:e2e` pass locally and in CI; at least one regression test per bug fixed later.

#### T-06 CI pipeline, Dependabot, bundle budget, repo hygiene — `ARCH-06`, `OPS-03`, `OPS-05` · Deps: T-01, T-05

- **Steps:** `.github/workflows/ci.yml` (Node LTS, `npm ci`, typecheck, lint, unit, build, size check, e2e on built preview); `lighthouse.yml` on Vercel preview deployments (LHCI with the budgets in §3.6, warn first then error); `.github/dependabot.yml` (npm weekly grouped, github-actions monthly); document branch protection + required checks for the owner.
- **AC:** CI runs on PRs and is required; budget failure blocks merge.

#### T-07 Env validation & central site config — `ARCH-09`, `ARCH-10` ⚡

- **Steps:** `src/lib/env.ts` (zod; clear error screen in dev, fail build in CI when missing); `.env.example`; `src/config/site.ts` (name, url, default locale, social, wakatime share ids, github username) replacing hard-coded values in `api.ts`, `about.tsx`, `index.html`, `useDocumentMeta.ts`.
- **AC:** grep finds no personal URLs/ids outside `site.ts`/DB; missing env produces a readable error.

### Phase 1 — Security

#### T-08 Admin allowlist for all writes (RLS + UI gate) — `SEC-01` · Deps: T-04

- **Steps:** migration per §3.3 (`admin_users`, `is_admin()`, rewrite all policies incl. messages/comments/storage); seed owner id via a manual SQL snippet documented in README (never commit the real UUID if the owner prefers—use `insert … select id from auth.users where email = …` run once); frontend `useIsAdmin`, `AdminRoute`, hide admin entry points for non-admins.
- **AC:** pgTAP or SQL tests (or a Playwright test against local Supabase) prove: anon can't write; a non-admin authenticated user can't read messages, can't insert projects, can't upload/delete storage; admin can do everything. Non-admin session visiting `/admin` is redirected.

#### T-09 Storage bucket hardening — `SEC-02` · Deps: T-08

- **Steps:** bucket `allowed_mime_types` (`image/webp,image/png,image/jpeg,image/avif,application/pdf`), `file_size_limit` (e.g. 5 MB), split policies with `is_admin()`, path prefix checks; `lib/upload.ts` generates `folder/<uuid>.<ext>`.
- **AC:** SVG/HTML upload rejected server-side; oversize rejected; e2e/unit tests for `upload.ts`.

#### T-10 Fix search filter injection — `SEC-03` ⚡

- **Steps:** `escapeIlike()` (escape `%`, `_`, `\`) and strip PostgREST reserved chars `,()` before building `.or()`; or switch to `textSearch` on a generated `tsvector` column (preferred when T-04 lands).
- **AC:** unit tests with inputs like `a,b`, `x)`, `%`, `_` return sane results and never error.

#### T-11 Server-side anti-spam for contact & comments + comment approval — `SEC-04` · Deps: T-08

- **Steps:** per §4.5.
- **AC:** direct REST insert with the anon key is rejected; >N submissions/IP/hour rejected; comments hidden until approved; Turnstile works in light/dark and both locales.

#### T-12 Security & caching headers — `SEC-05`, `PERF-10` ⚡

- **Steps:** `vercel.json` `headers`: CSP (start in `Content-Security-Policy-Report-Only`, then enforce), HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`; `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`, `/og/*`, model files.
- **AC:** securityheaders.com grade ≥ A on the preview; no CSP violations in e2e console.

#### T-13 Decide & fix the Wakatime proxy — `SEC-06` ⚡

- **Context:** PR #13 already hardened the handler (header auth, GET only, timeout/retry, generic errors). What's left is deciding whether it's used at all.
- **Steps:** Either delete `api/wakatime.ts` + `@vercel/node` (keep the public share JSON on the client, no secret involved), or make it the only client of Wakatime (add `stale-while-revalidate=86400`, types) and switch the client to `/api/wakatime` to get private stats. Ask the owner which one.
- **AC:** no unused function deployed; no secret in URLs.

### Phase 2 — Structure & DRY

#### T-14 Restructure into `src/` feature folders — `ARCH-01` · Deps: T-01, T-05

- **Steps:** move files per §3.1 with `git mv` (keep history), update aliases (`@/` → `src/`), Tailwind `content`, `index.html` entry. **No behaviour change.** Update `docs/architecture.md`, README tree.
- **AC:** e2e smoke green, bundle unchanged ±2 %.

#### T-15 Data layer refactor, query defaults, explicit columns — `ARCH-07`, `PERF-06`, `PERF-07` · Deps: T-14, T-03

- **Steps:** per §3.4; distinct tags/issuers via SQL view or RPC; remove `getUserId()` from inserts (DB default `user_id = auth.uid()` or drop `user_id` for single-owner tables).
- **AC:** list views don't download `content`; NotFound handled distinctly; unit tests for mappers/error mapping.

#### T-16 Shared UI primitives — `ARCH-03`, `UX-05` · Deps: T-14

- **Steps:** `Button`, `Field` (label/description/error wiring), `Dialog`, `Pagination` (URL-driven, ellipsis), `Skeleton` (shimmer), `EmptyState`, `ErrorState` (retry), `Tag`, `SocialLinks` (single icon map), `CertificateCard`, `TechBadge`, `PageHeader`; replace duplicates.
- **AC:** no duplicated pagination/social map/cert card remains (grep); visual parity screenshots.

#### T-17 Generic admin CRUD, upload service, slugify — `ARCH-03`, `ADM-10` · Deps: T-15, T-16, T-09

- **Steps:** per §4.6; react-hook-form + zod; send only dirty fields.
- **AC:** each admin tab ≤ ~80 lines of config/custom fields; unit tests for `slugify`, `upload`, `useCrudResource`.

### Phase 3 — Bugs, responsive & UX fixes

#### T-18 Fix blog tag filter — `UX-01` ⚡

- **Steps:** add `tag` param to `getBlogs` (`.contains('tags', [tag])`), pass `selectedTag`.
- **AC:** e2e: clicking a tag requests `tags=cs.{react}` and shows only matching posts.

#### T-19 404 page & error boundaries — `UX-03`, `SEO-05` ⚡

- **Steps:** catch-all `*` route → `NotFound` (noindex, links home/blog/projects); route `errorElement` with retry; detail pages map NotFound → 404 UI; prerendered `404.html` later (T-35).
- **AC:** `/xyz` and `/blog/unknown` show the 404 page in the correct theme.

#### T-20 Theme: no flash, system preference — `UX-04` ⚡

- **Steps:** inline script in `index.html` sets `class="dark"` before paint from `localStorage` or `matchMedia`; `ThemeProvider` at root with `light|dark|system`; `color-scheme` meta; favicon via media queries only.
- **AC:** no flash on reload (Playwright screenshot at first paint); system mode follows OS.

#### T-21 Small UX fixes: duplicate toast, CV/login visibility, login copy — `UX-08`, `UX-09` ⚡

- **AC:** one toast per submit; "Download CV" hidden without a CV; public nav has no "Sign In" (admin reaches `/login` directly; show "Dashboard" only for admins).

#### T-22 Responsive fixes across the matrix — `UX-02` · Deps: T-05

- **Steps:** nav breakpoint `lg`; hero layout per §3.7 (card hidden/below under `lg`); `break-words` titles, `overflow-x-auto` for code/tables; grid adjustments for 768–1023; footer stacking; admin tables/cards on mobile; Playwright matrix assertions (no horizontal scroll, nav fits, no overlap of `h1`/CTA with canvas bbox).
- **AC:** matrix e2e green at all 10 widths in light/dark.

#### T-23 URL-driven filters/pagination & locale-aware dates — `UX-06`, `UX-07` · Deps: T-16

- **AC:** refresh/back/share preserves search, tag, page; dates formatted with the active locale.

### Phase 4 — Performance

#### T-24 Route-level code splitting & vendor chunks — `PERF-01` ⚡

- **Steps:** `React.lazy` for every page, admin under its own chunk, `manualChunks` (`react`, `supabase`, `markdown`, `charts`, `three`); lazy `WakatimeStats`/recharts; preload next likely route on hover/focus of links.
- **AC:** initial JS for `/privacy` ≤ budget; three/rapier/recharts not in the entry chunk (verify with `rollup-plugin-visualizer`).

#### T-25 Optimize & lazy-load the 3D card; remove Vanta — `PERF-02`, `PERF-03`, `ANIM-06` · Deps: T-24

- **Steps:** per §4.4; delete Vanta + `vanta` dep, replace contact background with CSS gradient/mesh.
- **AC:** non-home routes download no `.glb`; home on mobile downloads no `.glb`; model ≤ 400 KB; long tasks on home ≤ 3 (Playwright perf observer); card is draggable on desktop.

#### T-26 Eliminate layout shift — `PERF-04` · Deps: T-25, T-31

- **AC:** CLS < 0.1 on home and all list/detail pages at every matrix width.

#### T-27 Image pipeline: compress on upload, lazy, dimensions — `PERF-05`, `ADM-04` · Deps: T-17

- **Steps:** browser compression to WebP (max 1600 px, quality ~0.8), store `width/height` (images as `jsonb [{url,w,h,alt}]` or parallel arrays — migration), `<Img>` component with `loading`, `decoding`, `sizes`, `fetchpriority` for LCP, alt text field in admin.
- **AC:** uploaded 4 MB JPEG stored ≤ 400 KB WebP; all `<img>` have width/height/alt.

#### T-28 Lighter decorative layers & fonts — `PERF-09`, `ANIM-03` ⚡

- **Steps:** replace blurred pulsing blobs with a static gradient (or transform-only animation of a pre-blurred image, `motion-safe`); remove dead font preconnects or self-host one variable font with `font-display: swap` + preload.
- **AC:** no `filter: blur` animation on full-viewport elements; paint time improved in perf trace.

### Phase 5 — Motion system

#### T-29 Motion foundation: reduced motion, Reveal & stagger — `ANIM-01`, `A11Y-05` · Deps: T-16

- **Steps:** per §3.8 (MotionConfig, tokens, `Reveal`, `Stagger`), replace ad-hoc `whileInView`; `motion-safe:` for Tailwind animations; marquee pause off-screen/hover/focus.
- **AC:** with reduced motion: 0 non-essential running animations (Playwright `document.getAnimations()`), no canvas; reveals run once.

#### T-30 Route transitions & scroll behaviour — `ANIM-02` · Deps: T-29

- **Steps:** `PageTransition` (≤ 200 ms) or View Transitions API; React Router `ScrollRestoration`; anchor links via `<Link to="/#contact">` + `scroll-margin-top`; remove `setTimeout` scroll hacks.
- **AC:** back/forward restores position; `#contact` lands below the navbar; no transition when reduced motion.

#### T-31 Hero: static H1 + accessible rotating role — `ANIM-04`, `SEO-06` · Deps: T-29

- **AC:** H1 contains the owner's name in prerendered HTML; rotating line has reserved width (no CLS), `aria-hidden`, stops under reduced motion.

#### T-32 Micro-interactions polish — `ANIM-05` · Deps: T-29

- **Steps:** catalogue in §3.8.
- **AC:** each interaction has a reduced-motion fallback; 60 fps in a Chrome perf trace on mid-tier mobile emulation (4× CPU throttle) for scroll + nav.

### Phase 6 — SEO & social

#### T-33 `<Seo>` component: canonical, meta, noindex, headings — `SEO-01`, `SEO-09` ⚡ · Deps: T-07

- **Steps:** per §4.3 with `react-helmet-async`; remove hard-coded canonical/OG from `index.html` (keep sane defaults); markdown heading offset (content `#` → `h2`).
- **AC:** every route has a self-referencing absolute canonical; `/login`, `/admin`, 404 have `noindex`; exactly one H1 per page.

#### T-34 Real links everywhere — `SEO-07`, `A11Y-02` ⚡

- **AC:** nav, footer, cards, "View all", back links are `<a href>`; cards have one primary link (stretched-link pattern), inner demo/repo links still work; middle-click opens new tab.

#### T-35 Build-time prerendering + rebuild on publish — `SEO-02`, `OPS-01` · Deps: T-33, T-34, T-25, T-15

- **Steps:** per §4.1.
- **AC:** `curl` of `/blog/<slug>` (with JS disabled) returns the article title, description, canonical, OG tags and body text; publishing a post triggers a deploy; site content readable when Supabase is unreachable (static HTML).

#### T-36 OG images (default + per post/project) — `SEO-03` · Deps: T-35

- **Steps:** per §4.2; 1200×630 default replaces `logo.png` usage.
- **AC:** opengraph.xyz / LinkedIn Post Inspector / WhatsApp preview show the right image + title for home, a project and a post, in both locales.

#### T-37 Generated sitemap & RSS — `SEO-04`, `SEO-11` · Deps: T-35

- **AC:** `sitemap.xml` lists every public URL × locale with `lastmod` + `xhtml:link` alternates; `rss.xml` validates (W3C feed validator); robots.txt points to sitemap.

#### T-38 Structured data per page; fix `sameAs` — `SEO-08`, `SEO-11` · Deps: T-33

- **Steps:** `Person` + `WebSite` (home), `ProfilePage` (about), `BlogPosting` (post: headline, image, datePublished/Modified, author, inLanguage), `CreativeWork`/`SoftwareSourceCode` (project), `BreadcrumbList`; verify social URLs with the owner.
- **AC:** Google Rich Results Test passes for home, a post, a project.

#### T-39 Icons & web manifest — `SEO-10` ⚡

- **AC:** SVG + PNG favicons (light/dark), `apple-touch-icon` 180×180, `site.webmanifest`, `theme-color` per scheme.

### Phase 7 — Internationalization (EN / ID)

#### T-40 UI i18n infrastructure, localized routes, hreflang, switcher — `I18N-01` · Deps: T-14, T-33

- **Steps:** per §3.5 (routing, detection banner, switcher in navbar + footer, `lang` attr, hreflang, translated aria-labels/toasts/zod messages); extract all strings.
- **AC:** every UI string comes from i18n (lint rule `i18next/no-literal-string` for JSX text); `/id/...` renders Indonesian UI; switching keeps the current page.

#### T-41 Translatable content + admin EN/ID tabs — `I18N-01` · Deps: T-40, T-17, T-04

- **Steps:** migration adding `translations jsonb`; `localize()` helper; admin tabs; prerender both locales (T-35 picks it up); OG images per locale when titles differ.
- **AC:** an ID translation entered in admin appears on `/id/...` after rebuild; missing translation falls back to EN with a notice.

### Phase 8 — Accessibility

#### T-42 Accessible names, landmarks, skip link, forms — `A11Y-01`, `A11Y-03`, `A11Y-04` · Deps: T-16

- **AC:** axe: 0 serious/critical violations on all public routes + admin; skip link visible on focus; every page has `header/nav/main/footer`.

#### T-43 Keyboard & touch: visible actions, accessible menu, target sizes — `A11Y-06`, `A11Y-07`, `A11Y-08` · Deps: T-16

- **AC:** admin actions visible on touch and on focus; mobile menu has `aria-expanded`, Esc closes, focus returns to toggle; all targets ≥ 44 px on touch layouts; carousel operable by keyboard and swipe.

#### T-44 Contrast audit & axe gate in CI — `A11Y-09` · Deps: T-05

- **AC:** WCAG 2.2 AA contrast in light and dark; axe check is a required CI step; `ACCESSIBILITY.md` updated with the conformance status.

### Phase 9 — Admin dashboard & content features

#### T-45 Delete confirmation (and undo) — `ADM-01` ⚡

- **AC:** every destructive action requires confirmation (dialog with item title) or offers a 5-second undo.

#### T-46 Stable, unique, editable slugs — `ADM-02` ⚡

- **Steps:** slug generated on create only, editable field with live uniqueness check, transliteration for non-Latin (`slugify` with `@sindresorhus/transliterate` or simple map), optional `slug_redirects` table used by the 404 page to redirect.
- **AC:** editing a title doesn't change the URL; duplicate titles get `-2` suffix.

#### T-47 Storage lifecycle: remove orphaned files — `ADM-03` · Deps: T-09, T-17

- **AC:** removing an image or deleting a record deletes its objects; a one-off script lists/removes existing orphans (dry-run first).

#### T-48 Blog drafts, scheduling, markdown preview — `ADM-05`, `ADM-06` · Deps: T-17, T-08

- **Steps:** `status` enum (`draft|published`), `published_at` picker, RLS hides drafts from public, preview route for admins, split-pane editor using the public `Markdown` renderer.
- **AC:** draft invisible publicly and absent from sitemap/prerender; scheduled post appears after its time (next rebuild — document a daily scheduled rebuild via GitHub Action cron calling the deploy hook).

#### T-49 Comment moderation UI — `ADM-07` · Deps: T-11, T-17

- **AC:** admin can approve/delete comments, filter by post, see pending count.

#### T-50 Dashboard ergonomics — `ADM-08` · Deps: T-17

- **Steps:** `/admin/:tab` routes, real Overview (counts, unread messages, latest comments), server-side pagination + search for messages, bulk ops via `.in()`, `mailto:` reply, `sort_order` + drag-to-reorder for projects/services/resume/tech stack.
- **AC:** refresh keeps the tab; reorder persists and is reflected publicly.

#### T-51 New message notifications — `ADM-09` · Deps: T-11

- **AC:** a new contact message triggers an email (Resend free) or Telegram message within a minute; secrets only in Supabase/Vercel env.

#### T-52 Blog & project reading experience — `UX-10`, `SEO-11` · Deps: T-16

- **Steps:** shared `Markdown` (remark-gfm, rehype-slug, autolink headings, highlighting at build where possible), TOC for long posts, reading time, share buttons (Web Share API + copy link), prev/next posts, related projects; carousel swipe/keyboard.
- **AC:** tables/code render correctly at 320 px; TOC links scroll under the navbar.

### Phase 10 — Operations, compliance, upgrades

#### T-53 Supabase keep-alive & scheduled backups — `OPS-01`, `OPS-02` ⚡

- **Steps:** GitHub Action cron (daily) doing a cheap read with the anon key; weekly `supabase db dump` + storage listing to an encrypted artifact (retention 90 days) or private repo; restore runbook in `docs/runbooks/restore.md`.
- **AC:** action history shows green runs; a restore was tested once against a local DB.

#### T-54 Analytics, uptime & error monitoring — `ARCH-12`

- **Steps:** Vercel Web Analytics + Speed Insights (cookieless), UptimeRobot/Better Stack monitor on `/` and a lightweight health endpoint, optional Sentry (free) with PII scrubbing; update privacy policy (T-55).
- **AC:** dashboards receive data from production; alert reaches the owner.

#### T-55 Accurate privacy policy & data retention — `SEC-09`

- **Steps:** `privacy_updated_at`/`terms_updated_at` columns shown instead of today; content lists processors (Vercel, Supabase, Cloudflare Turnstile, analytics), retention (e.g. messages auto-deleted after 12 months via scheduled SQL), contact for deletion requests; both locales.
- **AC:** "Last updated" is a stored date; retention job exists.

#### T-56 Staged major upgrades — `ARCH-11` · Deps: T-06 (CI must be green and meaningful)

- **Order:** (1) Vite latest + plugin-react; (2) React Router 7 (library mode) ; (3) React 19 + R3F 9/drei 10/rapier 2; (4) Tailwind 4 (`@tailwindcss/vite`, CSS-first config); (5) `motion`, lucide, sonner 2, zod 4. One PR per step, full matrix e2e each time.
- **AC:** `npm outdated` shows no majors behind (or documented exceptions).

---

## 6. Definition of Done & verification (every PR)

- [ ] Linked issue's acceptance criteria all met; regression test added for bugs.
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` pass locally.
- [ ] `npm run test:e2e` (matrix) passes; screenshots reviewed for UI changes at 320 / 768 / 1280 / 1920, light + dark.
- [ ] No new console errors/warnings in e2e.
- [ ] Bundle budget respected; no new dependency without justification in the PR body (size, license, maintenance).
- [ ] Security-relevant changes (RLS, storage, functions, headers) include a test or a documented manual check.
- [ ] Strings added via i18n (after T-40); a11y names provided.
- [ ] Docs updated (README / architecture / this plan's status table) when behaviour or setup changes.
- [ ] For DB changes: new migration file only (never edit merged ones), `db:types` regenerated, seed updated.

### Release checklist (after each phase)

- Lighthouse (mobile) on preview for `/`, `/about`, `/projects`, one project, `/blog`, one post — record scores in the tracking issue.
- securityheaders.com, Rich Results Test, opengraph preview, W3C feed validator (from Phase 6 on).
- Manual pass on a real phone (iOS Safari + Android Chrome).

---

## 7. Suggested session plan

| Session | Tasks                        | Notes                                       |
| ------- | ---------------------------- | ------------------------------------------- |
| 1       | T-02, T-01, T-07, T-18, T-21 | Cleanup + quick bug fixes, low risk         |
| 2       | T-04, T-03                   | Local Supabase + strict types               |
| 3       | T-05, T-06                   | Tests & CI — everything after this is safer |
| 4       | T-08, T-09, T-10, T-12, T-13 | Security pass                               |
| 5       | T-14, T-15                   | Restructure + data layer                    |
| 6       | T-16, T-17, T-19, T-20       | Shared UI, admin CRUD, 404, theme           |
| 7       | T-22, T-24, T-25, T-28       | Responsive + performance                    |
| 8       | T-29 … T-32, T-26            | Motion system + CLS                         |
| 9       | T-33, T-34, T-35             | SEO core + prerender                        |
| 10      | T-36 … T-39                  | OG, sitemap, structured data, icons         |
| 11      | T-40, T-41                   | i18n                                        |
| 12      | T-42 … T-44                  | Accessibility                               |
| 13      | T-45 … T-52                  | Admin & content features                    |
| 14      | T-11, T-51, T-53 … T-55      | Anti-spam, notifications, ops               |
| 15+     | T-56, T-23                   | Upgrades and remaining polish               |

---

## 8. Out of scope / later ideas

- `/uses`, `/now`, testimonials, printable résumé page generated from the `resume` table.
- PWA/offline reading for blog posts.
- Newsletter (Buttondown free) once RSS exists.
- Full-text search across posts/projects (Postgres FTS, after T-04).
- View counters / reactions (needs anti-abuse like T-11).

---

## 9. Issue index

| Task     | Issue                                                       | Title                                           | Phase | Audit IDs                 |
| -------- | ----------------------------------------------------------- | ----------------------------------------------- | ----- | ------------------------- |
| Tracking | [#15](https://github.com/ilramdhan/ilramdhan.dev/issues/15) | Improvement program                             | —     | all                       |
| T-01     | [#16](https://github.com/ilramdhan/ilramdhan.dev/issues/16) | ESLint, Prettier, EditorConfig                  | 0     | ARCH-05                   |
| T-02     | [#17](https://github.com/ilramdhan/ilramdhan.dev/issues/17) | Remove dead code & unused deps; fix vulns       | 0     | ARCH-02, SEC-07           |
| T-03     | [#18](https://github.com/ilramdhan/ilramdhan.dev/issues/18) | TypeScript strict + generated types             | 0     | ARCH-04                   |
| T-04     | [#19](https://github.com/ilramdhan/ilramdhan.dev/issues/19) | Supabase migrations, seed, constraints, indexes | 0     | ARCH-08, SEC-08, PERF-08  |
| T-05     | [#20](https://github.com/ilramdhan/ilramdhan.dev/issues/20) | Vitest + Playwright (mocked Supabase) + axe     | 0     | ARCH-06                   |
| T-06     | [#21](https://github.com/ilramdhan/ilramdhan.dev/issues/21) | CI, Dependabot, bundle budget                   | 0     | ARCH-06, OPS-03, OPS-05   |
| T-07     | [#22](https://github.com/ilramdhan/ilramdhan.dev/issues/22) | Env validation & site config                    | 0     | ARCH-09, ARCH-10          |
| T-08     | [#23](https://github.com/ilramdhan/ilramdhan.dev/issues/23) | Admin allowlist (RLS + UI gate)                 | 1     | SEC-01                    |
| T-09     | [#24](https://github.com/ilramdhan/ilramdhan.dev/issues/24) | Storage hardening                               | 1     | SEC-02                    |
| T-10     | [#25](https://github.com/ilramdhan/ilramdhan.dev/issues/25) | Search filter injection                         | 1     | SEC-03                    |
| T-11     | [#26](https://github.com/ilramdhan/ilramdhan.dev/issues/26) | Server-side anti-spam + comment approval        | 1     | SEC-04                    |
| T-12     | [#27](https://github.com/ilramdhan/ilramdhan.dev/issues/27) | Security & caching headers                      | 1     | SEC-05, PERF-10           |
| T-13     | [#28](https://github.com/ilramdhan/ilramdhan.dev/issues/28) | Remove/secure Wakatime proxy                    | 1     | SEC-06                    |
| T-14     | [#29](https://github.com/ilramdhan/ilramdhan.dev/issues/29) | Restructure into src/ feature folders           | 2     | ARCH-01                   |
| T-15     | [#30](https://github.com/ilramdhan/ilramdhan.dev/issues/30) | Data layer refactor & query defaults            | 2     | ARCH-07, PERF-06, PERF-07 |
| T-16     | [#31](https://github.com/ilramdhan/ilramdhan.dev/issues/31) | Shared UI primitives                            | 2     | ARCH-03, UX-05            |
| T-17     | [#32](https://github.com/ilramdhan/ilramdhan.dev/issues/32) | Generic admin CRUD, upload, slugify             | 2     | ARCH-03, ADM-10           |
| T-18     | [#33](https://github.com/ilramdhan/ilramdhan.dev/issues/33) | Bug: blog tag filter                            | 3     | UX-01                     |
| T-19     | [#34](https://github.com/ilramdhan/ilramdhan.dev/issues/34) | 404 page & error boundaries                     | 3     | UX-03, SEO-05             |
| T-20     | [#35](https://github.com/ilramdhan/ilramdhan.dev/issues/35) | Theme flash & system preference                 | 3     | UX-04                     |
| T-21     | [#36](https://github.com/ilramdhan/ilramdhan.dev/issues/36) | Small UX fixes                                  | 3     | UX-08, UX-09              |
| T-22     | [#37](https://github.com/ilramdhan/ilramdhan.dev/issues/37) | Responsive fixes 320–2560 px                    | 3     | UX-02                     |
| T-23     | [#38](https://github.com/ilramdhan/ilramdhan.dev/issues/38) | URL state & locale dates                        | 3     | UX-06, UX-07              |
| T-24     | [#39](https://github.com/ilramdhan/ilramdhan.dev/issues/39) | Route code splitting                            | 4     | PERF-01                   |
| T-25     | [#40](https://github.com/ilramdhan/ilramdhan.dev/issues/40) | 3D card optimize/lazy; remove Vanta             | 4     | PERF-02, PERF-03, ANIM-06 |
| T-26     | [#41](https://github.com/ilramdhan/ilramdhan.dev/issues/41) | Eliminate CLS                                   | 4     | PERF-04                   |
| T-27     | [#42](https://github.com/ilramdhan/ilramdhan.dev/issues/42) | Image pipeline                                  | 4     | PERF-05, ADM-04           |
| T-28     | [#43](https://github.com/ilramdhan/ilramdhan.dev/issues/43) | Lighter background layers & fonts               | 4     | PERF-09, ANIM-03          |
| T-29     | [#44](https://github.com/ilramdhan/ilramdhan.dev/issues/44) | Motion foundation (reduced motion, Reveal)      | 5     | ANIM-01, A11Y-05          |
| T-30     | [#45](https://github.com/ilramdhan/ilramdhan.dev/issues/45) | Route transitions & scroll                      | 5     | ANIM-02                   |
| T-31     | [#46](https://github.com/ilramdhan/ilramdhan.dev/issues/46) | Static H1 + rotating role                       | 5     | ANIM-04, SEO-06           |
| T-32     | [#47](https://github.com/ilramdhan/ilramdhan.dev/issues/47) | Micro-interactions                              | 5     | ANIM-05                   |
| T-33     | [#48](https://github.com/ilramdhan/ilramdhan.dev/issues/48) | &lt;Seo&gt; component, canonical, noindex       | 6     | SEO-01, SEO-09            |
| T-34     | [#49](https://github.com/ilramdhan/ilramdhan.dev/issues/49) | Real links everywhere                           | 6     | SEO-07, A11Y-02           |
| T-35     | [#50](https://github.com/ilramdhan/ilramdhan.dev/issues/50) | Build-time prerendering + rebuild hook          | 6     | SEO-02, OPS-01            |
| T-36     | [#51](https://github.com/ilramdhan/ilramdhan.dev/issues/51) | OG images                                       | 6     | SEO-03                    |
| T-37     | [#52](https://github.com/ilramdhan/ilramdhan.dev/issues/52) | Sitemap & RSS                                   | 6     | SEO-04, SEO-11            |
| T-38     | [#53](https://github.com/ilramdhan/ilramdhan.dev/issues/53) | Structured data & sameAs                        | 6     | SEO-08, SEO-11            |
| T-39     | [#54](https://github.com/ilramdhan/ilramdhan.dev/issues/54) | Favicons & manifest                             | 6     | SEO-10                    |
| T-40     | [#55](https://github.com/ilramdhan/ilramdhan.dev/issues/55) | i18n UI + localized routes                      | 7     | I18N-01                   |
| T-41     | [#56](https://github.com/ilramdhan/ilramdhan.dev/issues/56) | i18n content + admin tabs                       | 7     | I18N-01                   |
| T-42     | [#57](https://github.com/ilramdhan/ilramdhan.dev/issues/57) | A11y names, landmarks, forms                    | 8     | A11Y-01, A11Y-03, A11Y-04 |
| T-43     | [#58](https://github.com/ilramdhan/ilramdhan.dev/issues/58) | Keyboard & touch                                | 8     | A11Y-06, A11Y-07, A11Y-08 |
| T-44     | [#59](https://github.com/ilramdhan/ilramdhan.dev/issues/59) | Contrast & axe gate                             | 8     | A11Y-09                   |
| T-45     | [#60](https://github.com/ilramdhan/ilramdhan.dev/issues/60) | Delete confirmation                             | 9     | ADM-01                    |
| T-46     | [#61](https://github.com/ilramdhan/ilramdhan.dev/issues/61) | Stable slugs                                    | 9     | ADM-02                    |
| T-47     | [#62](https://github.com/ilramdhan/ilramdhan.dev/issues/62) | Storage orphan cleanup                          | 9     | ADM-03                    |
| T-48     | [#63](https://github.com/ilramdhan/ilramdhan.dev/issues/63) | Drafts, scheduling, preview                     | 9     | ADM-05, ADM-06            |
| T-49     | [#64](https://github.com/ilramdhan/ilramdhan.dev/issues/64) | Comment moderation                              | 9     | ADM-07                    |
| T-50     | [#65](https://github.com/ilramdhan/ilramdhan.dev/issues/65) | Admin ergonomics                                | 9     | ADM-08                    |
| T-51     | [#66](https://github.com/ilramdhan/ilramdhan.dev/issues/66) | New message notifications                       | 9     | ADM-09                    |
| T-52     | [#67](https://github.com/ilramdhan/ilramdhan.dev/issues/67) | Reading experience                              | 9     | UX-10, SEO-11             |
| T-53     | [#68](https://github.com/ilramdhan/ilramdhan.dev/issues/68) | Keep-alive & backups                            | 10    | OPS-01, OPS-02            |
| T-54     | [#69](https://github.com/ilramdhan/ilramdhan.dev/issues/69) | Analytics & monitoring                          | 10    | ARCH-12                   |
| T-55     | [#70](https://github.com/ilramdhan/ilramdhan.dev/issues/70) | Privacy dates & retention                       | 10    | SEC-09                    |
| T-56     | [#71](https://github.com/ilramdhan/ilramdhan.dev/issues/71) | Major upgrades                                  | 10    | ARCH-11                   |
