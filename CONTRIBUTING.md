# Contributing

Thanks for your interest! This is a personal portfolio, so most work is done by the owner (often with AI coding sessions), but bug reports, suggestions and focused pull requests are welcome.

> **AI sessions:** start with [`docs/PLAN.md`](docs/PLAN.md) §1. It defines task order, branch naming and the Definition of Done.

## Ground rules

- Be kind — see the [Code of Conduct](CODE_OF_CONDUCT.md).
- **Security problems are not reported in public issues** — see [SECURITY.md](SECURITY.md).
- One issue/task per pull request. Keep PRs small and reviewable.
- Never commit secrets (`.env*` is git-ignored; only `.env.example` is tracked).

## Getting started

```bash
git clone https://github.com/ilramdhan/ilramdhan.dev.git
cd ilramdhan.dev
npm ci
cp .env.example .env.local   # fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:3000
```

A local Supabase (via the Supabase CLI, migrations and seed data) is planned in task T-04; until then you need your own Supabase project created from `supabase/schema.sql` + `supabase/supabase-fix.sql`.

## Workflow

1. Find or open an issue (use the templates). For larger changes, wait for agreement on the approach.
2. Branch from `main`: `<type>/T-xx-short-name` or `<type>/short-name`
   - types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`, `ci`, `security`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `fix(blog): pass selected tag to getBlogs`.
4. Before pushing, run:
   ```bash
   npx tsc --noEmit
   npm run lint        # fixed in T-01
   npm run build
   ```
   plus `npm test` / `npm run test:e2e` once they exist (T-05).
5. Open a PR using the template, link the issue (`Closes #123`), include screenshots for UI changes (mobile 375 px + desktop, light + dark).

## Coding guidelines

- TypeScript, functional React components, hooks.
- Data access goes through the API/service layer, never `supabase.from(...)` inside components.
- Authorization lives in Supabase RLS; UI checks are only for UX.
- Tailwind for styling; reuse shared components instead of copying markup.
- Every interactive element must be keyboard-accessible and have an accessible name; animations must respect `prefers-reduced-motion`.
- User-facing strings go through i18n once it lands (T-40).
- Database changes: add a new migration, never edit an applied one.

## Reporting bugs / requesting features

Use the issue templates: **Bug report**, **Feature request**, or **Improvement / tech debt**. Include steps to reproduce, expected vs actual behavior, browser/device and screenshots.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
