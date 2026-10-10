-- ============================================================================
-- T-15 (#30): data layer support
--   * distinct tag / issuer lists computed in the database, so the browser no
--     longer downloads a column of every row and dedupes it in JS;
--   * user_id defaults to auth.uid() on the owner-scoped content tables.
--
-- Additive only: three new functions and column defaults. Nothing is dropped
-- and no rows are touched. The frontend is backward compatible: until this
-- file is applied the functions are missing (PGRST202) and it falls back to
-- the old column scan, and it still sends user_id on insert.
-- Re-runnable.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Distinct values. SECURITY INVOKER: the caller's RLS applies, so anon
--    only sees tags of published blog posts (drafts stay hidden).

create or replace function public.project_tags()
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct tag
  from public.projects, unnest(tags) as tag
  where tag is not null and tag <> ''
  order by tag;
$$;

create or replace function public.blog_tags()
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct tag
  from public.blogs, unnest(tags) as tag
  where tag is not null and tag <> ''
  order by tag;
$$;

create or replace function public.certificate_issuers()
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct issued_by
  from public.certificates
  where issued_by is not null and issued_by <> ''
  order by issued_by;
$$;

comment on function public.project_tags() is 'Distinct project tags (T-15).';
comment on function public.blog_tags() is 'Distinct tags of the blog posts visible to the caller (T-15).';
comment on function public.certificate_issuers() is 'Distinct certificate issuers (T-15).';

revoke all on function public.project_tags() from public;
revoke all on function public.blog_tags() from public;
revoke all on function public.certificate_issuers() from public;
grant execute on function public.project_tags() to anon, authenticated, service_role;
grant execute on function public.blog_tags() to anon, authenticated, service_role;
grant execute on function public.certificate_issuers() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. user_id defaults to the signed-in user (single owner)

alter table public.projects alter column user_id set default auth.uid();
alter table public.blogs alter column user_id set default auth.uid();
alter table public.resume alter column user_id set default auth.uid();
alter table public.services alter column user_id set default auth.uid();
alter table public.certificates alter column user_id set default auth.uid();
alter table public.tech_stack alter column user_id set default auth.uid();
