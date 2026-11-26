-- ============================================================================
-- T-41 (#56): translatable content
--   Adds `translations jsonb not null default '{}'` to every content table that
--   has user-facing text. Base columns stay English; other locales live under
--   their code, e.g. { "id": { "title": "…", "content": "…" } }.
--
-- Additive only: no rows are rewritten (existing rows get '{}'), no policies or
-- grants change (the new column is covered by the tables' existing RLS).
-- The frontend works before and after this file is applied: until then it
-- detects the missing column and serves the English text for /id pages.
-- Re-runnable.
-- ============================================================================

alter table public.profile      add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.projects     add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.blogs        add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.services     add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.resume       add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.certificates add column if not exists translations jsonb not null default '{}'::jsonb;

-- PostgREST caches the schema; make it see the new column right away.
notify pgrst, 'reload schema';
