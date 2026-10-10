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

For a fully local backend (Docker required) run `npm run db:start`, copy the printed API URL + anon key into `.env.local`, and use `npm run db:reset` to rebuild the database from `supabase/migrations/` + `supabase/seed.sql`. Details (local admin login, hosted projects) are in the README "Database" section.

Database changes:

- Every schema change is a new file from `npx supabase@2.120.0 migration new <name>`; never edit a migration that is already merged, and never run `supabase/legacy/*.sql`.
- Migrations must be safe on production data: no `DROP TABLE`/`DROP COLUMN` of data, `IF NOT EXISTS` where possible, `NOT VALID` for new `CHECK` constraints. The frontend must keep working before and after the owner applies them.
- After changing the schema run `npm run db:reset && npm run db:types` and commit the regenerated `lib/database.types.ts`.

## Workflow

1. Find or open an issue (use the templates). For larger changes, wait for agreement on the approach.
2. Branch from `main`: `<type>/T-xx-short-name` or `<type>/short-name`
   - types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`, `ci`, `security`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `fix(blog): pass selected tag to getBlogs`.
4. Before pushing, run:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run format:check   # or `npm run format` to fix
   npm run build
   npm test
   npm run test:e2e
   ```
5. Open a PR using the template, link the issue (`Closes #123`), include screenshots for UI changes (mobile 375 px + desktop, light + dark).

## Tests

### Unit / component tests (Vitest)

```bash
npm test             # run once (CI)
npm run test:watch   # watch mode
```

- Vitest + jsdom + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/); config in `vitest.config.mts`, setup (jest-dom matchers, cleanup) in `test/setup.ts`.
- Put tests next to the code as `*.test.ts(x)` (e.g. `lib/utils.test.ts`, `components/EnvErrorScreen.test.tsx`).
- Query by role/label (`screen.getByRole(...)`), not by class names. For modules that read `import.meta.env` at import time, use `vi.stubEnv()` + `vi.resetModules()` and re-import (see `lib/env.test.ts`).

### End-to-end tests (Playwright)

```bash
npx playwright install chromium   # once (CI uses --with-deps)
npm run test:e2e                  # builds dist-e2e/, serves it with vite preview, runs all projects
npm run test:e2e -- --project=w320          # one viewport
npm run test:e2e -- e2e/blog.spec.ts        # one spec
npm run test:e2e:ui                         # interactive UI mode
npx playwright show-report                  # HTML report of the last run
```

- The app is built with `VITE_SUPABASE_URL=https://mock.supabase.co` (`npm run build:e2e`) and **every** Supabase request is answered in-browser by `e2e/fixtures/supabase-mock.ts` from the dataset in `e2e/fixtures/dataset.ts`. All other third-party requests (images, fonts, WakaTime, GitHub) are stubbed, so tests never touch the network or a real database. No `.env` is needed.
- `@playwright/test` is pinned (currently `1.56.1`); bump it together with the browsers (`npx playwright install`). To use an already-installed Chromium, set `CHROMIUM_PATH=/path/to/chrome`.
- Locally an already running server on port 4173 is reused (start it yourself with `npm run build:e2e && npx vite preview --outDir dist-e2e --port 4173` to iterate faster).
- **Projects** (`playwright.config.ts`): `w320` … `w2560` (responsive matrix) plus `reduced-motion` and `light` run `e2e/smoke.spec.ts` only; `mobile` (360), `tablet` (768) and `desktop` (1280) run every other spec.
- Always import `test`/`expect` from `e2e/fixtures/test.ts`: it installs the Supabase mock, sets the theme and collects console errors (`consoleErrors` fixture). The `supabase` fixture exposes `db` (mutate it to change responses) and `requests` (assert what the app sent).
- **Adding mock data:** add rows/tables to `createDataset()` in `e2e/fixtures/dataset.ts`. The mock supports the PostgREST filters the app uses (`eq`, `cs` (array contains), `ilike`, `or=(…ilike…)`, `limit`/`offset` with `content-range` counts, `.single()`); extend `applyFilters()` in `supabase-mock.ts` if you use a new one. Writes (`POST`/`PATCH`/`DELETE`) return `201 []` and are recorded in `supabase.requests`.
- **Helpers:** `e2e/helpers/layout.ts` (`horizontalOverflow`, `overflowingElements`, `runningAnimations`, `observeCls`) and `e2e/helpers/a11y.ts` (`expectNoA11yViolations` — axe, **report-only**: violations are attached to the report; set `E2E_A11Y_ENFORCE=1` to make them fail).
- **Home page is slow in tests:** its two WebGL loops (3D card + Vanta) starve the main thread under software rendering. Specs that interact with it install fake timers (`page.clock.install()` … `page.clock.pauseAt(...)`, then `clock.fastForward(ms)`) — see `e2e/contact.spec.ts`. Don't do this before axe runs (axe needs real timers).
- **Known bugs:** mark a test `test.fixme(condition, 'description — #<issue>')` instead of letting it fail or deleting it (e.g. horizontal scroll from long words in detail-page titles at 320 px → #37, missing 404 page → #34). Remove the `fixme` in the PR that fixes the issue.

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
