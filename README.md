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
| Hosting        | Vercel (static SPA + optional serverless functions)                                      |

Architecture notes: [`docs/architecture.md`](docs/architecture.md).

## Getting started

### Prerequisites

- Node.js 20 LTS or newer, npm
- A Supabase project (free tier is enough)

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

1. In the Supabase SQL editor run `supabase/schema.sql` **on a new, empty project only** (it drops existing tables), then `supabase/supabase-fix.sql` (RLS hardening).
2. Create a public Storage bucket named `ilramdhan.dev`.
3. Enable the GitHub provider in **Auth → Providers**, add your site URL to the redirect URLs, and **disable new sign-ups** after your own account exists.
4. Insert your profile row (`profile.id` = your `auth.users.id`).

> Supabase CLI migrations + seed data for a fully local setup are planned (task T-04 in the plan).

### Scripts

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Dev server on <http://localhost:3000>      |
| `npm run build`   | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build                 |
| `npm run lint`    | ESLint (config being added in T-01)        |

## Project structure

```
.
├── App.tsx, index.tsx     # app shell & router (moving to src/ — plan T-14)
├── app/                   # route pages (+ admin/ tabs)
├── components/            # shared UI (Navbar, Hero, cards, forms…)
├── lib/                   # Supabase client, data access (api.ts), auth, theme, hooks
├── actions/               # client-side form validation
├── api/                   # Vercel serverless function(s)
├── supabase/              # SQL schema & RLS policies
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
