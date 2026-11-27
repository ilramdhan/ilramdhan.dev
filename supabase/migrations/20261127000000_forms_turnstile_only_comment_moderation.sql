-- Public forms go through the Turnstile-verifying functions (api/contact.ts, api/comment.ts), which
-- insert with the service-role key (bypasses RLS). The anon key can no longer insert directly, so a
-- bot can't skip the captcha by posting to /rest/v1. New comments wait for approval in the dashboard.
--
-- !! Deploy order: set VITE_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY in
-- Vercel and redeploy first (the app falls back to anon inserts without a site key); applying this before
-- that turns both forms off. Until it's applied, /admin/comments can't load (no `approved` column).

drop policy if exists "Anyone can send a message." on public.messages;
drop policy if exists "Anyone can comment." on public.blog_comments;

-- Moderation: existing comments stay visible, new ones are hidden until an admin approves them.
alter table public.blog_comments add column if not exists approved boolean not null default true;
alter table public.blog_comments alter column approved set default false;

drop policy if exists "Comments are viewable by everyone." on public.blog_comments;
drop policy if exists "Approved comments are public, admins see all." on public.blog_comments;
create policy "Approved comments are public, admins see all." on public.blog_comments
  for select using (approved or (select public.is_admin()));

-- The admin queue lists pending comments; the public list filters approved per post.
create index if not exists blog_comments_pending_idx
  on public.blog_comments (created_at desc) where not approved;
