-- ============================================================================
-- T-08 (#23): explicit admin allowlist for every write / private read
-- T-09 (#24): storage hardening (bucket limits + admin-only writes)
-- ============================================================================
-- Until now "admin" meant "any logged-in user" (sign-ups are off, but one
-- toggle would expose the inbox and allow defacement). This migration:
--   * creates public.admin_users (allowlist) and public.is_admin();
--   * rewrites the write policies of the repo-managed tables to is_admin();
--   * makes the inbox (messages select/update/delete) and comment moderation
--     admin-only;
--   * drops the extra permissive "Public can read <table>" policies that exist
--     on production but not in the repo (USING true). Public reads stay public
--     through the repo's own "... viewable by everyone." policies, except
--     blogs: drafts / scheduled posts (published_at in the future or NULL)
--     are now visible to admins only;
--   * T-09: limits the "ilramdhan.dev" bucket to images/PDF up to 5 MB and
--     replaces every write policy on it (including 4 production-only ones)
--     with admin-only insert/update/delete inside known folders. Public read
--     of the bucket stays.
--
-- Nothing is dropped except policies (by exact name) of the tables listed
-- below and of the "ilramdhan.dev" storage bucket. Re-running drops and
-- recreates the same policies (idempotent). Existing rows/objects are kept.
-- Tables/policies not managed by this repo are not touched.
--
-- !! ORDER MATTERS !!  is_admin() is false for everyone until the owner is in
-- admin_users. Right after running this file, run once in the SQL editor:
--
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = '<owner-email>'
--   on conflict do nothing;
--
-- Until then the public site keeps working, but admin writes are rejected.
-- Re-runnable.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Allowlist + helper

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Allowlist of admin accounts (T-08). Managed manually in the SQL editor.';

alter table public.admin_users enable row level security;

-- Clients never need this table directly (is_admin() is security definer);
-- an admin may only see their own row.
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Admins can read their own allowlist row." on public.admin_users;
create policy "Admins can read their own allowlist row." on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

comment on function public.is_admin() is
  'True when the current auth.uid() is in public.admin_users (T-08).';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Replace the extra permissive production-only read policies (USING true)
--    with the repo's intended public read policies. The baseline migration was
--    only *recorded* on production, so the intended policies are (re)created
--    here explicitly: public reads keep working whatever production had.

drop policy if exists "Public can read profile" on public.profile;
drop policy if exists "Public can read projects" on public.projects;
drop policy if exists "Public can read blogs" on public.blogs;
drop policy if exists "Public can read resume" on public.resume;
drop policy if exists "Public can read services" on public.services;
drop policy if exists "Public can read certificates" on public.certificates;
drop policy if exists "Public can read tech_stack" on public.tech_stack;

drop policy if exists "Profile is viewable by everyone." on public.profile;
create policy "Profile is viewable by everyone." on public.profile
  for select using (true);
drop policy if exists "Projects are viewable by everyone." on public.projects;
create policy "Projects are viewable by everyone." on public.projects
  for select using (true);
drop policy if exists "Resume is viewable by everyone." on public.resume;
create policy "Resume is viewable by everyone." on public.resume
  for select using (true);
drop policy if exists "Services are viewable by everyone." on public.services;
create policy "Services are viewable by everyone." on public.services
  for select using (true);
drop policy if exists "Certificates are viewable by everyone." on public.certificates;
create policy "Certificates are viewable by everyone." on public.certificates
  for select using (true);
drop policy if exists "Tech stack is viewable by everyone." on public.tech_stack;
create policy "Tech stack is viewable by everyone." on public.tech_stack
  for select using (true);
-- blogs' read policy is (re)created in section 3 (published or admin).

-- ---------------------------------------------------------------------------
-- 3. Content tables: public read (unchanged), admin-only writes

-- profile (the app only ever updates the single profile row)
drop policy if exists "Users can update their own profile." on public.profile;
drop policy if exists "Admins can update the profile." on public.profile;
create policy "Admins can update the profile." on public.profile
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- blogs: published posts for everyone, drafts/scheduled posts for admins
drop policy if exists "Published blogs are viewable by everyone." on public.blogs;
create policy "Published blogs are viewable by everyone." on public.blogs
  for select using (published_at <= now() or (select public.is_admin()));

-- projects, blogs, resume, services, certificates, tech_stack:
-- replace "Users can manage their own <x>." (FOR ALL, owner = auth.uid())
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('projects', 'Users can manage their own projects.'),
      ('blogs', 'Users can manage their own blogs.'),
      ('resume', 'Users can manage their own resume.'),
      ('services', 'Users can manage their own services.'),
      ('certificates', 'Users can manage their own certificates.'),
      ('tech_stack', 'Users can manage their own tech stack.')
    ) as v (tbl, old_policy)
  loop
    execute format('drop policy if exists %I on public.%I', t.old_policy, t.tbl);

    execute format('drop policy if exists %I on public.%I', 'Admins can insert ' || t.tbl || '.', t.tbl);
    execute format('drop policy if exists %I on public.%I', 'Admins can update ' || t.tbl || '.', t.tbl);
    execute format('drop policy if exists %I on public.%I', 'Admins can delete ' || t.tbl || '.', t.tbl);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select public.is_admin()))',
      'Admins can insert ' || t.tbl || '.', t.tbl);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      'Admins can update ' || t.tbl || '.', t.tbl);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select public.is_admin()))',
      'Admins can delete ' || t.tbl || '.', t.tbl);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 4. messages: anyone may send (unchanged), only admins read/update/delete

drop policy if exists "Authenticated users can view messages." on public.messages;
drop policy if exists "Authenticated users can update messages." on public.messages;
drop policy if exists "Authenticated users can delete messages." on public.messages;
drop policy if exists "Admins can view messages." on public.messages;
drop policy if exists "Admins can update messages." on public.messages;
drop policy if exists "Admins can delete messages." on public.messages;
create policy "Admins can view messages." on public.messages
  for select to authenticated using ((select public.is_admin()));
create policy "Admins can update messages." on public.messages
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can delete messages." on public.messages
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 5. blog_comments: anyone may comment / read (unchanged), admins moderate

drop policy if exists "Admin can update comments." on public.blog_comments;
drop policy if exists "Admin can delete comments." on public.blog_comments;
create policy "Admin can update comments." on public.blog_comments
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admin can delete comments." on public.blog_comments
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 6. Storage (T-09 / #24): bucket limits + admin-only writes, public read

-- Enforced by the Storage API itself, so it holds even if the UI is bypassed:
-- no SVG/HTML (stored XSS on the Supabase domain), no files over 5 MB.
-- Existing objects are not touched. The insert only runs on an empty
-- (local) database; production already has the bucket.
insert into storage.buckets (id, name, public)
values ('ilramdhan.dev', 'ilramdhan.dev', true)
on conflict (id) do nothing;

update storage.buckets
set
  file_size_limit = 5 * 1024 * 1024,
  allowed_mime_types = array['image/webp', 'image/png', 'image/jpeg', 'image/avif', 'application/pdf']
where id = 'ilramdhan.dev';

-- Production-only policies (folder = auth.uid(), i.e. any signed-in user)
drop policy if exists "Public read access for avatars" on storage.objects;
drop policy if exists "Users can upload to their own folder" on storage.objects;
drop policy if exists "Users can manage their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;
-- Repo baseline: FOR ALL to any authenticated user
drop policy if exists "Authenticated users can manage files in ilramdhan.dev" on storage.objects;

drop policy if exists "Public read access for ilramdhan.dev" on storage.objects;
create policy "Public read access for ilramdhan.dev" on storage.objects
  for select using (bucket_id = 'ilramdhan.dev');

drop policy if exists "Admins can upload to ilramdhan.dev" on storage.objects;
drop policy if exists "Admins can update files in ilramdhan.dev" on storage.objects;
drop policy if exists "Admins can delete files in ilramdhan.dev" on storage.objects;

create policy "Admins can upload to ilramdhan.dev" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ilramdhan.dev'
    and (select public.is_admin())
    and (storage.foldername(name))[1] = any (array['projects', 'blogs', 'certificates', 'avatars', 'logos', 'cv'])
  );
create policy "Admins can update files in ilramdhan.dev" on storage.objects
  for update to authenticated
  using (bucket_id = 'ilramdhan.dev' and (select public.is_admin()))
  with check (
    bucket_id = 'ilramdhan.dev'
    and (select public.is_admin())
    and (storage.foldername(name))[1] = any (array['projects', 'blogs', 'certificates', 'avatars', 'logos', 'cv'])
  );
create policy "Admins can delete files in ilramdhan.dev" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ilramdhan.dev' and (select public.is_admin()));
