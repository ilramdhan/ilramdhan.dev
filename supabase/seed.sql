-- ============================================================================
-- Local development seed data (dummy content only)
-- ============================================================================
-- Loaded automatically by `npm run db:reset` (supabase db reset) after the
-- migrations. NEVER run this against production.
-- Dataset mirrors the mocked data in docs/audit/harness/e2e.mjs.
--
-- Local admin user (email/password, sign-ups are off):
--   email:    admin@example.com
--   password: password123
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Auth: one local admin user
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'admin@example.com',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{"name":"Dummy Dev"}',
  now(), now(),
  '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '{"sub":"00000000-0000-4000-8000-000000000001","email":"admin@example.com","email_verified":true}',
  'email', now(), now(), now()
) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
insert into public.profile (
  id, logo_text, logo_url, display_name, badge_text, hero_title,
  short_description, detailed_bio, avatar_url, resume_url, address,
  footer_text, privacy_content, terms_content, social_links
) values (
  '00000000-0000-4000-8000-000000000001',
  'DummyDev', null, 'Dummy Dev', 'Open to work',
  'Web Developer, Backend Engineer, Open Source',
  'I build fast web apps.',
  E'## Hi\nThis is **dummy** bio.',
  'https://placehold.co/1200x630/png?text=avatar',
  'https://example.com/cv.pdf',
  'Jakarta, Indonesia',
  '© 2026 Dummy Dev',
  E'# Privacy\nDummy.',
  E'# Terms\nDummy.',
  '{"github":"https://github.com/dummy","linkedin":"https://linkedin.com/in/dummy","mail":"dummy@example.com"}'
) on conflict (id) do nothing;

insert into public.projects (
  user_id, title, slug, short_description, content, images, tech_stack, tags,
  demo_url, repo_url, is_featured, created_at
)
select
  '00000000-0000-4000-8000-000000000001',
  'Project ' || i,
  'project-' || i,
  'A dummy project description that is reasonably long to test clamping behaviour.',
  E'## Overview\nDummy content\n\n- a\n- b',
  array[
    'https://placehold.co/1200x630/png?text=p' || i || 'a',
    'https://placehold.co/1200x630/png?text=p' || i || 'b'
  ],
  array['React', 'Supabase', 'Go'],
  array[case when i % 2 = 0 then 'web' else 'backend' end, 'oss'],
  'https://example.com',
  'https://github.com/dummy/project-' || i,
  i <= 3,
  now() - make_interval(days => i)
from generate_series(1, 8) as i
on conflict (slug) do nothing;

insert into public.blogs (
  user_id, title, slug, excerpt, content, images, tags, is_featured, created_at, published_at
)
select
  '00000000-0000-4000-8000-000000000001',
  'Blog Post ' || i,
  'blog-post-' || i,
  'Dummy excerpt.',
  E'## Heading\nParagraph with `code`.\n\n```js\nconsole.log(1)\n```',
  array['https://placehold.co/1200x630/png?text=b' || i],
  array[case when i % 2 = 0 then 'react' else 'go' end],
  i <= 2,
  now() - make_interval(days => i),
  now() - make_interval(days => i)
from generate_series(1, 7) as i
on conflict (slug) do nothing;

-- A draft (future published_at) that must NOT be visible publicly
insert into public.blogs (user_id, title, slug, excerpt, content, tags, published_at)
values (
  '00000000-0000-4000-8000-000000000001',
  'Scheduled Draft', 'scheduled-draft', 'Not public yet.', 'Draft body.',
  array['draft'], now() + interval '30 days'
) on conflict (slug) do nothing;

insert into public.services (user_id, title, description, icon_name) values
  ('00000000-0000-4000-8000-000000000001', 'Service 1', 'Dummy **service**', 'code'),
  ('00000000-0000-4000-8000-000000000001', 'Service 2', 'Dummy **service**', 'cloud'),
  ('00000000-0000-4000-8000-000000000001', 'Service 3', 'Dummy **service**', 'database');

insert into public.tech_stack (user_id, name, icon_url, category) values
  ('00000000-0000-4000-8000-000000000001', 'React', null, 'Frontend'),
  ('00000000-0000-4000-8000-000000000001', 'TypeScript', null, 'Frontend'),
  ('00000000-0000-4000-8000-000000000001', 'Go', null, 'Backend'),
  ('00000000-0000-4000-8000-000000000001', 'PostgreSQL', null, 'Database'),
  ('00000000-0000-4000-8000-000000000001', 'Docker', null, 'DevOps');

insert into public.resume (user_id, type, title, institution, period, description, gpa, tags) values
  ('00000000-0000-4000-8000-000000000001', 'experience', 'Engineer', 'ACME', '2022 - Now',
    'Did things', null, array['Go', 'PostgreSQL']),
  ('00000000-0000-4000-8000-000000000001', 'education', 'BSc CS', 'Uni', '2018 - 2022',
    '', '3.8', array[]::text[]);

insert into public.certificates (
  user_id, title, description, issued_by, issued_date, expiry_date, credential_url, file_url
)
select
  '00000000-0000-4000-8000-000000000001',
  'Cert ' || i,
  'Dummy',
  case when i % 2 = 0 then 'Google' else 'AWS' end,
  date '2025-01-01' - i,
  null,
  'https://example.com',
  'https://placehold.co/1200x630/png?text=c' || i
from generate_series(1, 5) as i;

insert into public.messages (name, email, message, is_read) values
  ('Visitor', 'v@example.com', 'Hello there', false);

insert into public.blog_comments (blog_id, name, content)
select id, 'Reader', 'Nice post'
from public.blogs
where slug = 'blog-post-1';
