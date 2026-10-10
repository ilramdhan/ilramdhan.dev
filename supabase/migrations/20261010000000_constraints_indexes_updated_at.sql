-- ============================================================================
-- T-04 (#19): constraints, updated_at maintenance and indexes
-- ============================================================================
-- Safe to run on production (the owner applies it manually) and re-runnable:
--   * CHECK constraints are added NOT VALID (so legacy data can never make
--     this migration fail) and then validated one by one; any constraint that
--     existing rows violate stays NOT VALID with a NOTICE. It is still
--     enforced for new INSERTs/UPDATEs. Fix the rows, then run e.g.
--       alter table public.resume validate constraint resume_type_check;
--   * `resume.type` stays TEXT (no enum conversion that could fail on an
--     unexpected value); a NOT VALID CHECK restricts new rows instead.
--   * NOT NULL is only added after back-filling NULLs with the column default.
--   * `updated_at` columns are added with a constant default (no table rewrite)
--     and are maintained by a trigger, so the frontend never has to send them.
--   * Indexes use IF NOT EXISTS. The tables are small; a plain CREATE INDEX
--     only blocks writes for milliseconds.
--   * Nothing is dropped except this migration's own triggers (re-created).
-- The current frontend works unchanged both before and after this migration.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. NOT NULL where a default already exists (back-fill first)
-- ---------------------------------------------------------------------------
update public.projects set is_featured = false where is_featured is null;
update public.projects set created_at = now() where created_at is null;
alter table public.projects
  alter column is_featured set not null,
  alter column created_at set not null;

update public.blogs set is_featured = false where is_featured is null;
update public.blogs set created_at = now() where created_at is null;
alter table public.blogs
  alter column is_featured set not null,
  alter column created_at set not null;

update public.messages set is_read = false where is_read is null;
update public.messages set created_at = now() where created_at is null;
alter table public.messages
  alter column is_read set not null,
  alter column created_at set not null;

update public.certificates set created_at = now() where created_at is null;
alter table public.certificates alter column created_at set not null;

update public.tech_stack set created_at = now() where created_at is null;
alter table public.tech_stack alter column created_at set not null;

update public.blog_comments set created_at = now() where created_at is null;
alter table public.blog_comments alter column created_at set not null;

-- ---------------------------------------------------------------------------
-- 2. CHECK constraints (added NOT VALID, then validated when the data allows)
-- ---------------------------------------------------------------------------
-- Runs after the back-fill above so those UPDATEs can't trip a new constraint.
-- Each constraint is first added NOT VALID (no scan, cannot fail), then
-- VALIDATE is attempted; if legacy rows violate it, a NOTICE names the
-- constraint and it simply stays NOT VALID (still enforced for new writes).
-- Find offending rows with e.g.
--   select id, type from public.resume where type not in ('experience', 'education');
-- ---------------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select *
    from (
      values
        -- resume.type: replaces the planned enum, tolerant of legacy values
        ('resume', 'resume_type_check',
          $c$type in ('experience', 'education')$c$),
        -- contact messages (mirror the RLS insert limits + frontend validation)
        ('messages', 'messages_name_length_check',
          $c$char_length(btrim(name)) between 1 and 100$c$),
        ('messages', 'messages_email_length_check',
          $c$char_length(email) between 3 and 320 and position('@' in email) > 1$c$),
        ('messages', 'messages_message_length_check',
          $c$char_length(btrim(message)) between 1 and 5000$c$),
        -- blog comments
        ('blog_comments', 'blog_comments_name_length_check',
          $c$char_length(btrim(name)) between 1 and 100$c$),
        ('blog_comments', 'blog_comments_content_length_check',
          $c$char_length(btrim(content)) between 1 and 2000$c$),
        -- titles / names: generous upper bounds only
        ('projects', 'projects_title_length_check', $c$char_length(title) <= 300$c$),
        ('blogs', 'blogs_title_length_check', $c$char_length(title) <= 300$c$),
        ('certificates', 'certificates_title_length_check', $c$char_length(title) <= 300$c$),
        ('services', 'services_title_length_check', $c$char_length(title) <= 300$c$),
        ('resume', 'resume_title_length_check', $c$char_length(title) <= 300$c$),
        ('tech_stack', 'tech_stack_name_length_check', $c$char_length(name) <= 100$c$)
    ) as t (tbl, name, expr)
  loop
    if not exists (
      select 1
      from pg_constraint
      where conname = c.name
        and conrelid = format('public.%I', c.tbl)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I check (%s) not valid',
        c.tbl, c.name, c.expr
      );
    end if;
    begin
      execute format('alter table public.%I validate constraint %I', c.tbl, c.name);
    exception
      when check_violation then
        raise notice 'T-04: % on public.% left NOT VALID: existing rows violate it', c.name, c.tbl;
    end;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. updated_at columns + trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.projects add column if not exists updated_at timestamptz not null default now();
alter table public.blogs add column if not exists updated_at timestamptz not null default now();
alter table public.resume add column if not exists updated_at timestamptz not null default now();
alter table public.services add column if not exists updated_at timestamptz not null default now();
alter table public.certificates add column if not exists updated_at timestamptz not null default now();
alter table public.tech_stack add column if not exists updated_at timestamptz not null default now();
-- profile.updated_at already exists (nullable); it just gets the trigger.

do $$
declare
  t text;
begin
  foreach t in array array[
    'profile', 'projects', 'blogs', 'resume', 'services', 'certificates', 'tech_stack'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 4. Indexes for the hot filters / sort orders used by lib/api.ts
-- ---------------------------------------------------------------------------
create index if not exists projects_is_featured_created_at_idx
  on public.projects (is_featured, created_at desc);
create index if not exists projects_created_at_idx
  on public.projects (created_at desc);
create index if not exists projects_tags_gin_idx
  on public.projects using gin (tags);

create index if not exists blogs_published_at_idx
  on public.blogs (published_at desc);
create index if not exists blogs_is_featured_published_at_idx
  on public.blogs (is_featured, published_at desc);
create index if not exists blogs_tags_gin_idx
  on public.blogs using gin (tags);

create index if not exists blog_comments_blog_id_created_at_idx
  on public.blog_comments (blog_id, created_at);

create index if not exists certificates_issued_date_idx
  on public.certificates (issued_date desc);

create index if not exists resume_type_idx
  on public.resume (type);

create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

-- Foreign keys to auth.users (flagged by the Supabase "unindexed foreign keys" advisor)
create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists blogs_user_id_idx on public.blogs (user_id);
create index if not exists resume_user_id_idx on public.resume (user_id);
create index if not exists services_user_id_idx on public.services (user_id);
create index if not exists certificates_user_id_idx on public.certificates (user_id);
create index if not exists tech_stack_user_id_idx on public.tech_stack (user_id);
