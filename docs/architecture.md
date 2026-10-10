# Architecture Decision Record (SPA Runtime)

## Source layout

All application code lives in `src/` (the `@/` alias points there):

- `main.tsx`: entry point; mounts `Providers` (React Query, auth) and `AppRoutes`.
- `app/`: `routes.tsx`, `providers.tsx`, `layouts/` (public shell, navbar), `error/`, plus the auth and theme contexts and `AdminRoute`.
- `pages/`: route components (`home`, `blog`, `admin` and its tabs, ...).
- `features/`: domain code. Data features (`profile`, `projects`, `blog`, `certificates`, `resume`, `services`, `tech-stack`, `messages`, `wakatime`) each have `api.ts` (typed Supabase calls) and `queries.ts` (query keys + `queryOptions()` factories); `hero-3d` holds the 3D hero.
- `components/ui/`: shared UI primitives.
- `lib/`: Supabase client and result helpers (`supabase/`), typed errors (`errors.ts`), env validation, hooks and utilities.
- `config/site.ts`, `styles/global.css`, `types/` (generated `database.ts`), `test/` (setup and helpers).

## Rendering strategy

- The application runs as a **client-rendered Single Page Application (SPA)** built with React + Vite.
- Route transitions and page composition are handled in the client runtime.
- No production SSR pipeline is used in the current deployment model.

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

- Built as static assets using Vite (`npm run build`) and deployed as a static web app.
- Platform configuration (for example on Vercel) serves the SPA entry point and static assets.

## Planned evolution

- The target architecture (`src/` feature folders, build-time prerendering, admin allowlist RLS, i18n EN/ID, motion system) is specified in [`PLAN.md`](./PLAN.md) §3–§4, based on the findings in [`audit/AUDIT.md`](./audit/AUDIT.md).
