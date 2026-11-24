# Architecture Decision Record (SPA Runtime)

## Source layout

All application code lives in `src/` (the `@/` alias points there):

- `main.tsx`: entry point; mounts `Providers` (React Query, auth) and `AppRoutes`.
- `app/`: `routes.tsx`, `providers.tsx`, `layouts/` (public shell, navbar), `error/`, plus the auth and theme contexts and `AdminRoute`.
- `pages/`: route components (`home`, `blog`, `admin` and its tabs, ...).
- `features/`: domain code. Data features (`profile`, `projects`, `blog`, `certificates`, `resume`, `services`, `tech-stack`, `messages`, `wakatime`) each have `api.ts` (typed Supabase calls) and `queries.ts` (query keys + `queryOptions()` factories); `hero-3d` holds the 3D hero.
- `components/tile/`: design-system partials (`Tile`, `TileHeading`, `MediaFrame`, `SpecRow`, `LinkedGroup`, `PillButton`, `Disclosure`, `SegmentedControl`, ...), described in the root [`DESIGN.md`](../DESIGN.md). Import them by module (`@/components/tile/Tile`) from anything in the entry chunk.
- `components/motion/`: GSAP + Lenis engines (`*-engine.ts`, loaded with `import()` near the viewport or on idle; plugins registered once in `gsap.ts`) and their React wrappers (`FlipGroup`, `Marquee`, `ScrollFill`, `InsetReveal`, `RouteFade`, `SmoothScrollProvider`, ...). No framer-motion.
- `components/seo/`: `<Seo>`, `buildHead()`, JSON-LD builders (`json-ld.ts`), and `detail-fallback.ts` for the Vercel function.
- `i18n/`: `localePath()`/`splitLocale()`, typed `messages/{en,id}.ts` (`useT()`; the `id` dictionary is lazy), `localize()` for the `translations` jsonb column.
- `components/ui/`: shared UI primitives.
- `lib/`: Supabase client and result helpers (`supabase/`), typed errors (`errors.ts`), env validation, hooks and utilities.
- `config/site.ts`, `styles/global.css`, `types/` (generated `database.ts`), `test/` (setup and helpers).

## Rendering strategy

- React 19 SPA built with Vite 8 and Tailwind CSS 4 (`@tailwindcss/vite`, tokens in `styles/global.css`; no Tailwind or PostCSS config files).
- **Build-time prerendering:** `scripts/prerender.mjs` renders every public route in both locales (`/…` English, `/id/…` Indonesian) through `src/entry-server.tsx` to static HTML with head tags, hreflang, JSON-LD (SSR only) and the query data the client hydrates from. `/admin*` gets the empty SPA shell.
- Content published after the last deploy is served by `api/detail-page.ts` (Vercel function): the SPA shell with the same head and JSON-LD as a prerendered detail page.
- Route changes fade with View Transitions (`RouteFade`); motion engines and the 3D hero card are lazy chunks, so each route's initial JS stays within the budgets in `scripts/bundle-budget.json` (`npm run size`, enforced in CI).

## Authentication flow

- Authentication uses **Supabase Auth** from the browser via the client Supabase SDK.
- Users log in through the SPA login page, then session state is consumed by client-side auth utilities and protected UI flows.
- Server-only auth utilities are not part of the active production path.

## Data layer

- Primary data source is **Supabase Postgres** accessed with Supabase client APIs.
- Each feature's `api.ts` selects **explicit column lists** per view (`*_CARD_COLUMNS` for lists, `*_DETAIL_COLUMNS`, `*_ADMIN_COLUMNS`) built with `columns()`, which checks every name against the generated `types/database.ts`. List views never download markdown `content`.
- Tag and issuer filters come from the `project_tags()`, `blog_tags()` and `certificate_issuers()` database functions. Until migration `20261010200000` is applied, the old column scan is used instead.
- Every failure is converted with `toAppError()` (`lib/errors.ts`) into `NotFoundError`, `AuthError`, `ValidationError`, `NetworkError` or `ServerError`. Detail pages show "Not Found" only for `NotFoundError` and a retry for anything else.
- Components use `useQuery(<feature>Queries.<view>(...))`. Keys are hierarchical (`['projects', 'list', { page, limit, tag }]`, `['projects', 'detail', slug]`), so `invalidateQueries({ queryKey: projectKeys.all })` refreshes every project view.
- QueryClient defaults (`app/query-client.ts`) are `staleTime` 5 min, `gcTime` 30 min, no refetch on window focus, and one retry except for 4xx errors.
- Mutations and reads are initiated from client-side flows (forms, dashboard actions, and page-level data hooks).

## Deployment model

- `npm run build` = Vite build + prerender to `dist/`; Vercel serves it with clean URLs and the rewrites in `vercel.json` (unknown detail slugs → `api/detail-page`).

## History

- The architecture came from [`PLAN.md`](./PLAN.md) §3–§4 and [`audit/AUDIT.md`](./audit/AUDIT.md); the visual redesign (R0–R9) is logged in [`redesign/STATE.md`](./redesign/STATE.md).
