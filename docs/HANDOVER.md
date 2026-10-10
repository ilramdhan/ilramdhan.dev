# Handover prompt — ilramdhan.dev improvement program (paste into a new AI session)

You are continuing an in-progress improvement program on GitHub repo **ilramdhan/ilramdhan.dev** (personal portfolio: Vite + React 18 + TS SPA, Tailwind, TanStack Query, Supabase DB/Auth/Storage, Vercel Hobby, Supabase Free). Do NOT re-audit or re-plan. Everything is already specified.

## Read first (in repo, `main`)

- `docs/PLAN.md`: design spec, owner decisions (§2), target architecture (§3), detailed designs (§4), 56 tasks T-01…T-56 with steps and acceptance criteria (§5), Definition of Done (§6), issue index (§9: T-n = issue #(n+15)).
- `docs/audit/AUDIT.md`: findings with IDs (SEC-, PERF-, SEO-, A11Y-, UX-, ANIM-, ADM-, ARCH-, I18N-, OPS-).
- `CONTRIBUTING.md`: dev setup, scripts, test/CI, release flow.
- Tracking issue **#15** (checklist). Each task issue has steps and acceptance criteria.

## Status (2026-10-10)

**Done (merged, issues closed):**

- T-01 #16 (PR #74)
- T-02 #17 (#73)
- T-03 #18 (#79)
- T-04 #19 (#78)
- T-05 #20 (#81)
- T-06 #21 (#82)
- T-07 #22 (#75)
- T-10 #25 (#97)
- T-12 #27 (#99)
- T-13 #28 (#96)
- T-18 #33 (#76)
- T-21 #36 (#77)
- T-57 #80 (#94): release-please + version shown in the footer

Dependabot: majors closed (handled in T-56), majors ignored in `.github/dependabot.yml` (#98), minor/patch merged (#100, #101).

**Group 1 (T-08 #23 + T-09 #24):** PR #102 (admin allowlist + storage hardening). The frontend is backward compatible; the migration `20261010100000_admin_allowlist.sql` must be run by the owner (see the PR's "Manual DB step").

**Remaining open:**

- T-11 #26
- T-14…T-17 #29–#32
- T-19, T-20, T-22, T-23 #34, #35, #37, #38
- T-24…T-28 #39–#43
- T-29…T-32 #44–#47
- T-33…T-39 #48–#54
- T-40, T-41 #55, #56
- T-42…T-44 #57–#59
- T-45…T-52 #60–#67
- T-53…T-56 #68–#71
- Release PR **#95** ("release 0.2.0") stays open on purpose; the owner merges it to cut a release.

## Suggested grouping (one branch/PR per group; multi-issue PR body has one `Closes #N` per issue; one commit per issue)

1. T-08 + T-09 (PR #102)
2. Refactor T-14, T-15, T-16, T-17
3. UI: T-19, T-20, T-23, then T-22 (responsive; turn #37 `test.fixme`s into passing tests)
4. Performance: T-24, T-25 (keep 3D card lazy/desktop-only, remove Vanta), T-28, T-27, T-26
5. Motion: T-29…T-32
6. SEO: T-33, T-34, T-35 (vite-react-ssg prerender + deploy hook behind env), T-36…T-39
7. i18n: T-40, T-41 (EN at `/`, ID at `/id`; `translations jsonb`)
8. A11y: T-42…T-44
9. Admin + anti-spam: T-11, T-45…T-52
10. Ops and upgrades: T-53, T-54, T-55, then T-56 (staged major upgrades, one PR per step)

## Binding rules

- **Workflow per group:** `git fetch origin main && git checkout -B <type>/T-xx-name origin/main`, implement, then verify locally. The verify commands are `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build && npm run size`, plus the relevant `npm run test:e2e` specs (CHROMIUM_PATH: see CONTRIBUTING). Then push and open the PR (template `.github/pull_request_template.md`; title `T-xx: …`; body includes `Closes #N` + test results). Comment "Implemented in #PR" on each issue. Wait for **GitHub Actions CI green**, then merge (merge commit) yourself (owner authorized), then the next group. Never merge red; never skip or disable tests. Turn existing `test.fixme(... #issue)` into real tests when you fix them.
- **Commits:** Conventional Commits with a descriptive body referencing T-xx/#issue. Commit and PR footers per your environment's attribution rules. No model names in code or PR text.
- **No breaking changes or regressions.** The live site must keep working at every merge.
- **Supabase production** (project `yzlyeumcwirnvvgdqhrd`; Supabase MCP may be connected):
  - NEVER delete data or drop tables or columns.
  - The DB also has tables NOT managed by this repo (`faq`, `tasks`, `bug_reports`, `chatbot_feedback`, `meeting_requests`, `message_logs`, `schedules`). Never touch them or their policies.
  - Read-only `execute_sql` inspection is OK. **Do not call `apply_migration`**: DDL confirmation can't be shown, so it gets cancelled. Write migrations in `supabase/migrations/`, make the frontend backward-compatible (works before and after), and give the owner the SQL to run in the Supabase SQL Editor.
  - After the owner runs it, verify and record the version: `insert into supabase_migrations.schema_migrations (version, name) values (...) on conflict do nothing`.
  - Applied on prod so far: `20260101000000` (baseline, recorded only) and `20261010000000` (constraints/indexes/updated_at).
- **External services** (Turnstile, Vercel deploy hook, Supabase webhooks, Resend/Telegram, Actions secrets, analytics, Sentry, uptime): implement behind env flags, disabled by default, and document the env vars/secrets in the PR + README/.env.example.
- **Token economy:** read only the needed lines (`grep -n`, `sed -n`); pipe noisy output through `| tail`; use `--reporter=dot`; run targeted e2e locally (the full matrix runs in CI); poll CI at most every ~3 min; unsubscribe from PR webhook activity if your tool adds it; keep reports short.

## Owner's pending manual steps (remind once at the end)

1. Confirm `profile.logo_url` doesn't use `public/logo/ir-*-nav.png` (kept until confirmed).
2. Enable branch protection on `main` (require CI); see CONTRIBUTING.
3. Remove `WAKATIME_API_KEY` from the Vercel env vars.
4. After ~1 week with no CSP violations, switch the CSP in `vercel.json` from Report-Only to enforced.
5. Merge release PR #95 when a release is wanted; optionally tag `90f17ba` as `v0.1.0`.
6. When T-08/T-09 is merged: run its migration in the SQL Editor, then the admin seed one-liner immediately.

Group 1 is PR #102. Continue with group 2 (refactor T-14…T-17).
