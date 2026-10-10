# Security Policy

## Supported versions

Only the current `main` branch (deployed at <https://ilramdhan.dev>) receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately via GitHub: **Security → Advisories → [Report a vulnerability](https://github.com/ilramdhan/ilramdhan.dev/security/advisories/new)**. If that isn't available, use the contact form at <https://ilramdhan.dev/#contact> and ask for a private channel (don't include exploit details there).

Please include:

- affected URL / file and a description of the issue,
- steps to reproduce or a proof of concept,
- impact as you understand it.

What to expect:

- acknowledgement within **7 days**,
- a fix or mitigation plan within **30 days** for confirmed issues,
- credit in the fix commit/advisory if you want it.

## Scope

In scope: this repository's code, Supabase Row Level Security policies and storage policies defined here, Vercel configuration, and the deployed site.

Out of scope: denial-of-service/volumetric attacks, social engineering, issues in third-party services themselves (Supabase, Vercel, GitHub), and reports from automated scanners without a demonstrated impact.

## Security model (summary)

- The browser only receives the public Supabase **anon** key; all authorization is enforced by **Row Level Security** in Postgres.
- Admin access is via GitHub OAuth with sign-ups disabled. Being signed in is not enough: every write, the inbox and comment moderation require the account to be in the `public.admin_users` allowlist (checked by `public.is_admin()` in RLS); the `/admin` route signs out any other account. Keep sign-ups disabled anyway.
- Server-only secrets live in Vercel/Supabase environment variables and are never prefixed with `VITE_`.

Please test only against your own Supabase project or a local instance — never against production data.
