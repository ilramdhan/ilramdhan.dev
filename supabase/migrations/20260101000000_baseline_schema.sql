-- ============================================================================
-- Baseline: the production schema as of T-04 (#19)
-- ============================================================================
-- Reproduces the tables from supabase/legacy/schema.sql together with the RLS
-- policies as they are in effect after supabase/legacy/supabase-fix.sql.
--
-- Production ALREADY HAS this schema. Do not run this file there; instead mark
-- it as applied once so the CLI's migration history matches:
--
--   supabase migration repair --status applied 20260101000000
--
-- The file is written to be non-destructive and re-runnable anyway:
--   * no DROP TABLE / DROP COLUMN / DELETE anywhere,
--   * tables use CREATE TABLE IF NOT EXISTS,
--   * every policy is dropped (if present) and re-created with the exact
--     definition production uses, so running it twice is a no-op.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- Profile / general settings (one row, keyed by the owner's auth user id)
create table if not exists public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  updated_at timestamptz default now(),
  logo_text text default 'DevFolio',
  logo_url text,
  display_name text,
  badge_text text,
  hero_title text,
  short_description text,
  detailed_bio text,
  avatar_url text,
  resume_url text,
  address text,
  footer_text text,
  privacy_content text,
  terms_content text,
  social_links jsonb
);

create table if not exists public.projects (
  id serial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  title text not null,
  slug text unique,
  short_description text,
  content text,
  images text[],
  tech_stack text[],
  tags text[],
  demo_url text,
  repo_url text,
  is_featured boolean default false
);

create table if not exists public.blogs (
  id serial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  published_at timestamptz,
  title text not null,
  slug text unique,
  excerpt text,
  content text,
  images text[],
  tags text[],
  is_featured boolean default false
);

create table if not exists public.resume (
  id serial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  institution text,
  period text,
  description text,
  gpa text,
  tags text[]
);

create table if not exists public.services (
  id serial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  description text,
  icon_name text
);

create table if not exists public.messages (
  id serial primary key,
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean default false
);

create table if not exists public.certificates (
  id serial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  description text,
  issued_by text,
  issued_date date,
  expiry_date date,
  credential_url text,
  file_url text,
  created_at timestamptz default now()
);

create table if not exists public.tech_stack (
  id serial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  icon_url text,
  category text,
  created_at timestamptz default now()
);

create table if not exists public.blog_comments (
  id serial primary key,
  blog_id integer references public.blogs (id) on delete cascade,
  name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profile enable row level security;
alter table public.projects enable row level security;
alter table public.blogs enable row level security;
alter table public.resume enable row level security;
alter table public.services enable row level security;
alter table public.messages enable row level security;
alter table public.certificates enable row level security;
alter table public.tech_stack enable row level security;
alter table public.blog_comments enable row level security;

-- profile
drop policy if exists "Profile is viewable by everyone." on public.profile;
drop policy if exists "Users can update their own profile." on public.profile;
create policy "Profile is viewable by everyone." on public.profile
  for select using (true);
create policy "Users can update their own profile." on public.profile
  for update using ((select auth.uid()) = id);

-- projects
drop policy if exists "Projects are viewable by everyone." on public.projects;
drop policy if exists "Users can manage their own projects." on public.projects;
create policy "Projects are viewable by everyone." on public.projects
  for select using (true);
create policy "Users can manage their own projects." on public.projects
  for all using ((select auth.uid()) = user_id);

-- blogs
drop policy if exists "Published blogs are viewable by everyone." on public.blogs;
drop policy if exists "Users can manage their own blogs." on public.blogs;
create policy "Published blogs are viewable by everyone." on public.blogs
  for select using (published_at <= now());
create policy "Users can manage their own blogs." on public.blogs
  for all using ((select auth.uid()) = user_id);

-- resume
drop policy if exists "Resume is viewable by everyone." on public.resume;
drop policy if exists "Users can manage their own resume." on public.resume;
create policy "Resume is viewable by everyone." on public.resume
  for select using (true);
create policy "Users can manage their own resume." on public.resume
  for all using ((select auth.uid()) = user_id);

-- services
drop policy if exists "Services are viewable by everyone." on public.services;
drop policy if exists "Users can manage their own services." on public.services;
create policy "Services are viewable by everyone." on public.services
  for select using (true);
create policy "Users can manage their own services." on public.services
  for all using ((select auth.uid()) = user_id);

-- messages (the original catch-all policy was replaced by per-action ones)
drop policy if exists "Anyone can send a message." on public.messages;
drop policy if exists "Authenticated users can manage messages." on public.messages;
drop policy if exists "Authenticated users can view messages." on public.messages;
drop policy if exists "Authenticated users can update messages." on public.messages;
drop policy if exists "Authenticated users can delete messages." on public.messages;
create policy "Anyone can send a message." on public.messages
  for insert to anon, authenticated
  with check (
    length(name) <= 100
    and length(email) <= 320
    and length(message) <= 5000
  );
create policy "Authenticated users can view messages." on public.messages
  for select using ((select auth.role()) = 'authenticated');
create policy "Authenticated users can update messages." on public.messages
  for update using ((select auth.role()) = 'authenticated');
create policy "Authenticated users can delete messages." on public.messages
  for delete using ((select auth.role()) = 'authenticated');

-- certificates
drop policy if exists "Certificates are viewable by everyone." on public.certificates;
drop policy if exists "Users can manage their own certificates." on public.certificates;
create policy "Certificates are viewable by everyone." on public.certificates
  for select using (true);
create policy "Users can manage their own certificates." on public.certificates
  for all using ((select auth.uid()) = user_id);

-- tech_stack
drop policy if exists "Tech stack is viewable by everyone." on public.tech_stack;
drop policy if exists "Users can manage their own tech stack." on public.tech_stack;
create policy "Tech stack is viewable by everyone." on public.tech_stack
  for select using (true);
create policy "Users can manage their own tech stack." on public.tech_stack
  for all using ((select auth.uid()) = user_id);

-- blog_comments (the original catch-all admin policy was replaced by per-action ones)
drop policy if exists "Anyone can comment." on public.blog_comments;
drop policy if exists "Comments are viewable by everyone." on public.blog_comments;
drop policy if exists "Admin can manage comments." on public.blog_comments;
drop policy if exists "Admin can update comments." on public.blog_comments;
drop policy if exists "Admin can delete comments." on public.blog_comments;
create policy "Anyone can comment." on public.blog_comments
  for insert to anon, authenticated
  with check (
    length(name) <= 100
    and length(content) <= 2000
  );
create policy "Comments are viewable by everyone." on public.blog_comments
  for select using (true);
create policy "Admin can update comments." on public.blog_comments
  for update using ((select auth.role()) = 'authenticated');
create policy "Admin can delete comments." on public.blog_comments
  for delete using ((select auth.role()) = 'authenticated');

-- ---------------------------------------------------------------------------
-- 3. Storage: public bucket used for uploads + its policies
-- ---------------------------------------------------------------------------
-- Production already has this bucket; ON CONFLICT leaves it untouched.
insert into storage.buckets (id, name, public)
values ('ilramdhan.dev', 'ilramdhan.dev', true)
on conflict (id) do nothing;

drop policy if exists "Public read access for ilramdhan.dev" on storage.objects;
drop policy if exists "Authenticated users can manage files in ilramdhan.dev" on storage.objects;
create policy "Public read access for ilramdhan.dev" on storage.objects
  for select using (bucket_id = 'ilramdhan.dev');
create policy "Authenticated users can manage files in ilramdhan.dev" on storage.objects
  for all to authenticated
  with check (bucket_id = 'ilramdhan.dev');
