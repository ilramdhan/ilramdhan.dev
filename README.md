# ilramdhan.dev — Portfolio Website

Personal portfolio of **Ilham Ramadhan**: projects, blog, certificates, résumé and coding activity, with a private admin dashboard for managing all content.

**Live:** <https://ilramdhan.dev>

> 🚧 **An improvement program is in progress.** See the [audit](docs/audit/AUDIT.md) for what's being fixed and the [plan](docs/PLAN.md) for the roadmap (security hardening, performance, SEO/prerendering, Indonesian + English, accessibility, motion polish).

## Features

- **Content-managed site** — profile, projects, blog posts, services, tech stack, experience/education and certificates are stored in Supabase and edited from the dashboard.
- **Admin dashboard** (`/admin`) — GitHub OAuth login, CRUD for all content, image/PDF uploads to Supabase Storage, contact-message inbox.
- **Blog** — Markdown posts with tags, search and comments.
- **Projects & certificates** — galleries, tag/issuer filters, pagination.
- **Dark / light theme.**
- **Interactive hero** — physics-based 3D lanyard card (React Three Fiber + Rapier).
- **Coding activity** — Wakatime public stats and GitHub activity graph.

## Tech stack

| Layer          | Tools                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| UI             | React 18, TypeScript, Vite 5, Tailwind CSS 3 (+ typography), Framer Motion, Lucide icons |
| Routing & data | React Router 6, TanStack Query 5, Supabase JS 2, Zod                                     |
| 3D             | three.js, @react-three/fiber, drei, rapier, meshline                                     |
| Content        | react-markdown, Recharts                                                                 |
| Backend        | Supabase (Postgres + Row Level Security, Auth with GitHub OAuth, Storage)                |
| Hosting        | Vercel (static SPA, no serverless functions)                                             |

Architecture notes: [`docs/architecture.md`](docs/architecture.md).

## Getting started

### Prerequisites

- Node.js 20 LTS or newer, npm
- Docker (for the local Supabase stack), or a hosted Supabase project (free tier is enough)

### Setup

```bash
git clone https://github.com/ilramdhan/ilramdhan.dev.git
cd ilramdhan.dev
npm ci
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Only `VITE_*` variables reach the browser. Never put service-role keys or other secrets in a `VITE_` variable.

### Database

The schema lives in Supabase CLI migrations under [`supabase/migrations/`](supabase/migrations/); [`supabase/seed.sql`](supabase/seed.sql) holds dummy content for local development. The old hand-run SQL files are kept for reference only in [`supabase/legacy/`](supabase/legacy/README.md) — don't run them.

#### Local Supabase (recommended for development)

Requires Docker. The npm scripts run a pinned Supabase CLI through `npx`.

```bash
npm run db:start   # start local Supabase (Postgres, Auth, Storage, Studio) and apply migrations
npm run db:reset   # re-create the local DB from migrations + seed.sql
npm run db:stop    # stop the containers
```

`db:start` prints the local API URL and anon key; put them in `.env.local`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key printed by db:start>
```

Then `npm run dev`. The seed creates a local admin user (`admin@example.com` / `password123`, local only) that owns all seeded content. Sign-ups are off locally as in production, and the GitHub provider is not configured locally, so to use `/admin` sign in once from the browser console on the dev site, e.g. `await (await import('/src/lib/supabase/client.ts')).supabase.auth.signInWithPassword({ email: 'admin@example.com', password: 'password123' })`, or enable `[auth.external.github]` in `supabase/config.toml` with your own OAuth app. Studio runs on <http://127.0.0.1:54323>.

After changing the schema, add a migration (`npx supabase@2.120.0 migration new <name>`), run `npm run db:reset`, then `npm run db:types` to regenerate `src/types/database.ts`.

#### Hosted project

- **New project:** `npx supabase@2.120.0 link --project-ref <ref>` then `npx supabase@2.120.0 db push` (applies all migrations, never the seed). Then enable the GitHub provider in **Auth → Providers**, add your site URL to the redirect URLs, **disable new sign-ups** after your own account exists, insert your profile row (`profile.id` = your `auth.users.id`), and add yourself to the admin allowlist: `insert into public.admin_users (user_id) select id from auth.users where email = '<your-email>' on conflict do nothing;` (without it every write is denied).
- **Existing production (created from the legacy SQL):** it already matches the baseline migration. Mark it as applied once instead of running it: `npx supabase@2.120.0 migration repair --status applied 20260101000000`. Later migrations are applied manually by the owner (SQL editor or `db push`) — see each PR's "Manual step" section — and then marked applied the same way.

### Scripts

| Command                | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Dev server on <http://localhost:3000>                             |
| `npm run build`        | Type-check and production build to `dist/`                        |
| `npm run preview`      | Serve the production build                                        |
| `npm run lint`         | ESLint (flat config, zero warnings allowed)                       |
| `npm run lint:fix`     | ESLint with autofix                                               |
| `npm run format`       | Format the repo with Prettier                                     |
| `npm run format:check` | Check formatting (CI)                                             |
| `npm run db:start`     | Start local Supabase (Docker)                                     |
| `npm run db:stop`      | Stop local Supabase                                               |
| `npm run db:reset`     | Rebuild local DB from migrations + seed                           |
| `npm run db:types`     | Regenerate `src/types/database.ts` (local)                        |
| `npm run test:db`      | RLS/storage policy tests on a throwaway Postgres (`DATABASE_URL`) |

## Project structure

```
.
├── src/
│   ├── main.tsx           # entry: providers + routes
│   ├── app/               # routes.tsx, providers.tsx, layouts/, error/, auth & theme contexts
│   ├── pages/             # route components (+ admin/ tabs)
│   ├── features/          # per domain: api.ts + queries.ts (profile, projects, blog, ...), hero-3d
│   ├── components/ui/     # shared UI primitives
│   ├── lib/               # Supabase client + helpers, typed errors, env validation, hooks, utils
│   ├── config/site.ts     # site name, URL, usernames, WakaTime share URLs (single source)
│   ├── styles/            # global.css
│   ├── types/             # database.ts (generated), globals, shared types
│   └── test/              # test setup and helpers
├── supabase/              # CLI config, migrations, seed.sql (legacy/ = old SQL, do not run)
├── public/                # static assets (logos, 3D model, robots, sitemap)
└── docs/                  # architecture, audit, plan
```

## Deployment

Vercel builds with `npm run build` and serves `dist/` with an SPA rewrite (`vercel.json`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment.

## Documentation

- [Audit report](docs/audit/AUDIT.md) — findings with evidence
- [Improvement plan & design spec](docs/PLAN.md) — phased tasks for upcoming sessions
- [Architecture](docs/architecture.md)
- [Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [Accessibility](ACCESSIBILITY.md) · [Support](SUPPORT.md) · [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) © Ilham Ramadhan
