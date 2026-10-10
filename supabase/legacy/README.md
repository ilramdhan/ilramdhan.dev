# Legacy SQL — do not run

> [!WARNING]
> These files are kept for reference only. **Never run them against any database you care about.**
> `schema.sql` starts with `DROP TABLE … CASCADE` for every table and would wipe all content.

| File               | What it was                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `schema.sql`       | Original hand-run schema (drops and re-creates every table + storage policies) |
| `supabase-fix.sql` | Hand-run RLS hardening applied on top of `schema.sql` in production          |

Both are superseded by the Supabase CLI migrations in [`../migrations/`](../migrations/):

- `20260101000000_baseline_schema.sql` reproduces exactly the production state these two files produced (same tables, columns, constraints and effective policies), without any `DROP TABLE`. Production already has it, so it is only marked as applied:
  `npx supabase@2.120.0 migration repair --status applied 20260101000000`
- Later migrations change the schema from there.

See the "Database" section of the root `README.md` for local development and hosted setup.
