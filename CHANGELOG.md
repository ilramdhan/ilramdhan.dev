# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added

- Full repository audit with measurements and screenshots (`docs/audit/AUDIT.md`).
- Improvement plan & design spec for upcoming work (`docs/PLAN.md`).
- Community health files: `LICENSE` (MIT), `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ACCESSIBILITY.md`, `SUPPORT.md`, `CODEOWNERS`.
- GitHub issue forms (bug, feature, improvement), issue template config and pull request template.
- `.env.example`.

### Changed

- README rewritten: accurate stack, setup, project structure, docs links.
- `react-router-dom` bumped to 6.30.6; `@vercel/node` moved to devDependencies; non-breaking `npm audit fix` (T-02).

### Removed

- Dead code and assets: `components/band.tsx`, `app/layout.tsx`, `experimental/`, `metadata.json`, `public/next.svg`, `public/vercel.svg`, `public/assets/images/{front,back}.png`, `delay()`, `submitContactForm()` (T-02).
- Unused dependencies: `next-themes`, `class-variance-authority`, `@supabase/ssr`, `@types/recharts` (T-02).

## [0.1.0] - 2026

Initial portfolio: Vite + React SPA, Supabase (DB, Auth, Storage), admin dashboard, blog, projects, certificates, Wakatime stats.
