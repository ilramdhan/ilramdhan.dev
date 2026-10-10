-- T-08 (#23): admin allowlist. anon and a non-admin authenticated user can't
-- write anything or read the inbox; the allowlisted admin can do everything.

-- ---------------------------------------------------------------------------
-- Fixtures (as the superuser, RLS bypassed)
reset role;
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'admin@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'someone@example.test');
-- The documented seed one-liner (README / PR).
insert into public.admin_users (user_id)
select id from auth.users where email = 'admin@example.test'
on conflict do nothing;

insert into public.profile (id, display_name) values ('00000000-0000-4000-8000-00000000000a', 'Owner');
insert into public.projects (user_id, title, slug) values ('00000000-0000-4000-8000-00000000000a', 'P1', 'p1');
insert into public.blogs (user_id, title, slug, published_at) values
  ('00000000-0000-4000-8000-00000000000a', 'Published', 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-00000000000a', 'Draft', 'draft', null),
  ('00000000-0000-4000-8000-00000000000a', 'Scheduled', 'scheduled', now() + interval '1 day');
insert into public.resume (user_id, type, title) values ('00000000-0000-4000-8000-00000000000a', 'experience', 'R1');
insert into public.services (user_id, title) values ('00000000-0000-4000-8000-00000000000a', 'S1');
insert into public.certificates (user_id, title) values ('00000000-0000-4000-8000-00000000000a', 'C1');
insert into public.tech_stack (user_id, name) values ('00000000-0000-4000-8000-00000000000a', 'T1');
insert into public.messages (name, email, message) values ('Visitor', 'v@example.test', 'Hello');
insert into public.blog_comments (blog_id, name, content) select id, 'Reader', 'Nice' from public.blogs where slug = 'published';

-- ---------------------------------------------------------------------------
-- Production drift is gone, unrelated objects untouched
select tests.ok(not exists (
  select 1 from pg_policies where schemaname = 'public' and policyname like 'Public can read %'
), 'extra "Public can read <table>" policies are dropped');
select tests.ok(not exists (
  select 1 from pg_policies where schemaname = 'public'
    and (policyname like 'Users can manage their own %' or policyname like 'Authenticated users can %')
), 'old "any logged-in user" policies are dropped');
select tests.ok(exists (
  select 1 from pg_policies where schemaname = 'public' and tablename = 'faq' and policyname = 'faq readable'
), 'policies of tables not managed by the repo are untouched');

-- ---------------------------------------------------------------------------
-- anon
set role anon;
select tests.claims('anon');

select tests.ok(public.is_admin() = false, 'anon: is_admin() is false');
select tests.ok((select count(*) from public.profile) = 1, 'anon: profile is public');
select tests.ok((select count(*) from public.projects) = 1, 'anon: projects are public');
select tests.ok((select count(*) from public.resume) = 1, 'anon: resume is public');
select tests.ok((select count(*) from public.services) = 1, 'anon: services are public');
select tests.ok((select count(*) from public.certificates) = 1, 'anon: certificates are public');
select tests.ok((select count(*) from public.tech_stack) = 1, 'anon: tech_stack is public');
select tests.ok((select count(*) from public.blog_comments) = 1, 'anon: comments are public');
select tests.ok((select array_agg(slug) from public.blogs) = array['published'], 'anon: only published blogs are visible');
select tests.ok((select count(*) from public.messages) = 0, 'anon: cannot read messages');
select tests.denied($$select * from public.admin_users$$, 'anon: cannot read admin_users');

select tests.ok(tests.affected($$insert into public.messages (name, email, message) values ('A', 'a@example.test', 'hi')$$) = 1, 'anon: can send a message');
select tests.ok(tests.affected($$insert into public.blog_comments (blog_id, name, content) select 1, 'A', 'hi'$$) = 1, 'anon: can comment');

select tests.denied($$insert into public.projects (title) values ('x')$$, 'anon: cannot insert projects');
select tests.denied($$insert into public.blogs (title, published_at) values ('x', now())$$, 'anon: cannot insert blogs');
select tests.denied($$insert into public.admin_users (user_id) values ('00000000-0000-4000-8000-00000000000b')$$, 'anon: cannot add admins');
select tests.ok(tests.affected($$update public.projects set title = 'hacked'$$) = 0, 'anon: cannot update projects');
select tests.ok(tests.affected($$delete from public.projects$$) = 0, 'anon: cannot delete projects');
select tests.ok(tests.affected($$update public.profile set display_name = 'hacked'$$) = 0, 'anon: cannot update profile');
select tests.ok(tests.affected($$update public.messages set is_read = true$$) = 0, 'anon: cannot update messages');
select tests.ok(tests.affected($$delete from public.blog_comments$$) = 0, 'anon: cannot delete comments');

-- ---------------------------------------------------------------------------
-- authenticated, NOT in the allowlist
reset role;
set role authenticated;
select tests.claims('00000000-0000-4000-8000-00000000000b');

select tests.ok(public.is_admin() = false, 'non-admin: is_admin() is false');
select tests.ok((select count(*) from public.admin_users) = 0, 'non-admin: sees no admin_users rows');
select tests.ok((select count(*) from public.messages) = 0, 'non-admin: cannot read messages');
select tests.ok((select array_agg(slug) from public.blogs) = array['published'], 'non-admin: drafts are hidden');
select tests.ok(tests.affected($$update public.messages set is_read = true$$) = 0, 'non-admin: cannot update messages');
select tests.ok(tests.affected($$delete from public.messages$$) = 0, 'non-admin: cannot delete messages');
select tests.ok(tests.affected($$update public.blog_comments set content = 'x'$$) = 0, 'non-admin: cannot update comments');
select tests.ok(tests.affected($$delete from public.blog_comments$$) = 0, 'non-admin: cannot delete comments');
select tests.ok(tests.affected($$update public.profile set display_name = 'hacked'$$) = 0, 'non-admin: cannot update profile');
select tests.denied($$insert into public.admin_users (user_id) values ('00000000-0000-4000-8000-00000000000b')$$, 'non-admin: cannot add itself as admin');

select tests.denied($$insert into public.projects (user_id, title) values ('00000000-0000-4000-8000-00000000000b', 'x')$$, 'non-admin: cannot insert projects (even with own user_id)');
select tests.denied($$insert into public.blogs (user_id, title, published_at) values ('00000000-0000-4000-8000-00000000000b', 'x', now())$$, 'non-admin: cannot insert blogs');
select tests.denied($$insert into public.resume (user_id, type, title) values ('00000000-0000-4000-8000-00000000000b', 'education', 'x')$$, 'non-admin: cannot insert resume');
select tests.denied($$insert into public.services (user_id, title) values ('00000000-0000-4000-8000-00000000000b', 'x')$$, 'non-admin: cannot insert services');
select tests.denied($$insert into public.certificates (user_id, title) values ('00000000-0000-4000-8000-00000000000b', 'x')$$, 'non-admin: cannot insert certificates');
select tests.denied($$insert into public.tech_stack (user_id, name) values ('00000000-0000-4000-8000-00000000000b', 'x')$$, 'non-admin: cannot insert tech_stack');
select tests.ok(tests.affected($$update public.projects set title = 'hacked'$$) = 0, 'non-admin: cannot update projects');
select tests.ok(tests.affected($$update public.tech_stack set name = 'hacked'$$) = 0, 'non-admin: cannot update tech_stack');
select tests.ok(tests.affected($$delete from public.blogs$$) = 0, 'non-admin: cannot delete blogs');
select tests.ok(tests.affected($$delete from public.certificates$$) = 0, 'non-admin: cannot delete certificates');

-- ---------------------------------------------------------------------------
-- the admin
reset role;
set role authenticated;
select tests.claims('00000000-0000-4000-8000-00000000000a');

select tests.ok(public.is_admin() = true, 'admin: is_admin() is true');
select tests.ok((select count(*) from public.admin_users) = 1, 'admin: sees its own allowlist row');
select tests.ok((select count(*) from public.messages) = 2, 'admin: reads messages');
select tests.ok((select count(*) from public.blogs) = 3, 'admin: sees drafts and scheduled posts');
select tests.ok(tests.affected($$update public.messages set is_read = true$$) = 2, 'admin: updates messages');
select tests.ok(tests.affected($$update public.profile set display_name = 'Owner 2'$$) = 1, 'admin: updates profile');
select tests.ok(tests.affected($$update public.blog_comments set content = 'edited'$$) = 2, 'admin: moderates comments');

select tests.ok(tests.affected($$insert into public.projects (user_id, title) values ('00000000-0000-4000-8000-00000000000a', 'P2')$$) = 1, 'admin: inserts projects');
select tests.ok(tests.affected($$insert into public.blogs (user_id, title) values ('00000000-0000-4000-8000-00000000000a', 'Draft 2')$$) = 1, 'admin: inserts blogs');
select tests.ok(tests.affected($$insert into public.resume (user_id, type, title) values ('00000000-0000-4000-8000-00000000000a', 'education', 'R2')$$) = 1, 'admin: inserts resume');
select tests.ok(tests.affected($$insert into public.services (user_id, title) values ('00000000-0000-4000-8000-00000000000a', 'S2')$$) = 1, 'admin: inserts services');
select tests.ok(tests.affected($$insert into public.certificates (user_id, title) values ('00000000-0000-4000-8000-00000000000a', 'C2')$$) = 1, 'admin: inserts certificates');
select tests.ok(tests.affected($$insert into public.tech_stack (user_id, name) values ('00000000-0000-4000-8000-00000000000a', 'T2')$$) = 1, 'admin: inserts tech_stack');

select tests.ok(tests.affected($$update public.projects set title = title || '!'$$) = 2, 'admin: updates projects');
select tests.ok(tests.affected($$update public.blogs set title = title || '!'$$) = 4, 'admin: updates blogs (incl. drafts)');
select tests.ok(tests.affected($$update public.resume set title = title || '!'$$) = 2, 'admin: updates resume');
select tests.ok(tests.affected($$update public.services set title = title || '!'$$) = 2, 'admin: updates services');
select tests.ok(tests.affected($$update public.certificates set title = title || '!'$$) = 2, 'admin: updates certificates');
select tests.ok(tests.affected($$update public.tech_stack set name = name || '!'$$) = 2, 'admin: updates tech_stack');

select tests.ok(tests.affected($$delete from public.projects where title = 'P2!'$$) = 1, 'admin: deletes projects');
select tests.ok(tests.affected($$delete from public.blogs where slug is null$$) = 1, 'admin: deletes blogs');
select tests.ok(tests.affected($$delete from public.resume where title = 'R2!'$$) = 1, 'admin: deletes resume');
select tests.ok(tests.affected($$delete from public.services where title = 'S2!'$$) = 1, 'admin: deletes services');
select tests.ok(tests.affected($$delete from public.certificates where title = 'C2!'$$) = 1, 'admin: deletes certificates');
select tests.ok(tests.affected($$delete from public.tech_stack where name = 'T2!'$$) = 1, 'admin: deletes tech_stack');
select tests.ok(tests.affected($$delete from public.blog_comments where name = 'A'$$) = 1, 'admin: deletes comments');
select tests.ok(tests.affected($$delete from public.messages where name = 'A'$$) = 1, 'admin: deletes messages');

-- ---------------------------------------------------------------------------
-- Removing the owner from the allowlist revokes everything immediately
reset role;
delete from public.admin_users;
set role authenticated;
select tests.claims('00000000-0000-4000-8000-00000000000a');
select tests.ok(public.is_admin() = false, 'unseeded allowlist: is_admin() is false for the owner too');
select tests.ok((select count(*) from public.messages) = 0, 'unseeded allowlist: inbox closed');
select tests.ok((select count(*) from public.projects) = 1, 'unseeded allowlist: public reads keep working');

-- restore for later test files
reset role;
insert into public.admin_users (user_id) values ('00000000-0000-4000-8000-00000000000a');
