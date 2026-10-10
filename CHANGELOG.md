# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added

- Full repository audit with measurements and screenshots (`docs/audit/AUDIT.md`).
- Improvement plan & design spec for upcoming work (`docs/PLAN.md`).
- Community health files: `LICENSE` (MIT), `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ACCESSIBILITY.md`, `SUPPORT.md`, `CODEOWNERS`.
- GitHub issue forms (bug, feature, improvement), issue template config and pull request template.
- `.env.example`.
- ESLint 9 flat config (typescript-eslint type-aware, react-hooks, react-refresh, jsx-a11y, import), Prettier, `.editorconfig`, and `lint:fix` / `format` / `format:check` scripts (T-01).
- `lib/env.ts`: zod validation of `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; missing or invalid values show a readable configuration error screen instead of a blank page (T-07).
- `config/site.ts`: central site config; `index.html` meta tags and JSON-LD are injected from it at build time (T-07).
- Supabase CLI setup (`supabase/config.toml`), a non-destructive baseline migration of the production schema + RLS policies, a migration adding CHECK/NOT NULL constraints, `updated_at` triggers and indexes, `supabase/seed.sql` dummy data, and `db:start` / `db:stop` / `db:reset` / `db:types` scripts for a fully local backend (T-04).

### Changed

- `supabase/schema.sql` and `supabase/supabase-fix.sql` moved to `supabase/legacy/` (reference only; superseded by migrations) (T-04).

- README rewritten: accurate stack, setup, project structure, docs links.
- `react-router-dom` bumped to 6.30.6; `@vercel/node` moved to devDependencies; non-breaking `npm audit fix` (T-02).
- Public navbar no longer shows a "Sign In" button; "Dashboard" appears only when logged in, `/login` stays reachable directly. Login page has a single H1 "Admin login" (T-21).

### Fixed

- Blog tag filter: selecting a tag now filters posts (`getBlogs` gained a `tag` parameter using `tags=cs.{tag}`) (T-18).
- Contact form shows a single success toast; "Download CV" is hidden when no CV is set; GitHub activity link uses the same username as the graph (T-21).

### Removed

- Dead code and assets: `components/band.tsx`, `app/layout.tsx`, `experimental/`, `metadata.json`, `public/next.svg`, `public/vercel.svg`, `public/assets/images/{front,back}.png`, `delay()`, `submitContactForm()` (T-02).
- Unused dependencies: `next-themes`, `class-variance-authority`, `@supabase/ssr`, `@types/recharts` (T-02).

## [0.1.0] - 2026

Initial portfolio: Vite + React SPA, Supabase (DB, Auth, Storage), admin dashboard, blog, projects, certificates, Wakatime stats.
