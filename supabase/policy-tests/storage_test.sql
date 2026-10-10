-- T-09 (#24): storage hardening. Bucket limits are set (the Storage API
-- enforces them, so SVG/HTML and files over 5 MB are rejected server-side),
-- only the admin can write/update/delete objects in known folders, the
-- public can still read, and other buckets are untouched.

-- ---------------------------------------------------------------------------
-- Bucket configuration + policy set
reset role;
select tests.ok(
  (select file_size_limit from storage.buckets where id = 'ilramdhan.dev') = 5242880,
  'bucket: file_size_limit is 5 MB');
select tests.ok(
  (select allowed_mime_types from storage.buckets where id = 'ilramdhan.dev')
    = array['image/webp', 'image/png', 'image/jpeg', 'image/avif', 'application/pdf'],
  'bucket: only webp/png/jpeg/avif/pdf are allowed');
select tests.ok(
  not ((select allowed_mime_types from storage.buckets where id = 'ilramdhan.dev')
    && array['image/svg+xml', 'text/html']),
  'bucket: SVG and HTML are not allowed');
select tests.ok(
  (select public from storage.buckets where id = 'ilramdhan.dev'),
  'bucket: stays public');
select tests.ok(
  (select file_size_limit is null and allowed_mime_types is null from storage.buckets where id = 'other-bucket'),
  'other buckets are untouched');

select tests.ok(not exists (
  select 1 from pg_policies where schemaname = 'storage' and policyname in (
    'Public read access for avatars',
    'Users can upload to their own folder',
    'Users can manage their own files',
    'Users can delete their own files',
    'Authenticated users can manage files in ilramdhan.dev')
), 'storage: production-only and "any logged-in user" policies are dropped');
select tests.ok(exists (
  select 1 from pg_policies where schemaname = 'storage' and policyname = 'other bucket uploads'
), 'storage: policies of other buckets are untouched');

-- Fixture object uploaded earlier by the owner
insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', 'projects/existing.webp');

-- ---------------------------------------------------------------------------
-- anon
set role anon;
select tests.claims('anon');
select tests.ok((select count(*) from storage.objects where bucket_id = 'ilramdhan.dev') = 1, 'anon: can read the bucket');
select tests.denied($$insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', 'projects/a.webp')$$, 'anon: cannot upload');
select tests.ok(tests.affected($$update storage.objects set name = 'projects/x.webp' where bucket_id = 'ilramdhan.dev'$$) = 0, 'anon: cannot update objects');
select tests.ok(tests.affected($$delete from storage.objects where bucket_id = 'ilramdhan.dev'$$) = 0, 'anon: cannot delete objects');

-- ---------------------------------------------------------------------------
-- authenticated, NOT in the allowlist
reset role;
set role authenticated;
select tests.claims('00000000-0000-4000-8000-00000000000b');
select tests.ok((select count(*) from storage.objects where bucket_id = 'ilramdhan.dev') = 1, 'non-admin: can read the bucket');
select tests.denied($$insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', 'projects/a.webp')$$, 'non-admin: cannot upload');
select tests.denied($$insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', '00000000-0000-4000-8000-00000000000b/a.webp')$$, 'non-admin: cannot upload into a folder named after its uid');
select tests.ok(tests.affected($$update storage.objects set name = 'projects/x.webp' where bucket_id = 'ilramdhan.dev'$$) = 0, 'non-admin: cannot update objects');
select tests.ok(tests.affected($$delete from storage.objects where bucket_id = 'ilramdhan.dev'$$) = 0, 'non-admin: cannot delete objects');
select tests.ok(tests.affected($$insert into storage.objects (bucket_id, name) values ('other-bucket', 'x/y.txt')$$) = 1, 'non-admin: other buckets keep their own rules');

-- ---------------------------------------------------------------------------
-- the admin
reset role;
set role authenticated;
select tests.claims('00000000-0000-4000-8000-00000000000a');
select tests.ok(tests.affected($$insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', 'projects/new.webp')$$) = 1, 'admin: uploads to projects/');
select tests.ok(tests.affected($$insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', 'cv/new.pdf')$$) = 1, 'admin: uploads to cv/');
select tests.denied($$insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', 'root.webp')$$, 'admin: cannot upload outside the known folders (root)');
select tests.denied($$insert into storage.objects (bucket_id, name) values ('ilramdhan.dev', 'random/a.webp')$$, 'admin: cannot upload outside the known folders');
select tests.ok(tests.affected($$update storage.objects set metadata = '{}'::jsonb where bucket_id = 'ilramdhan.dev'$$) = 3, 'admin: updates objects');
select tests.denied($$update storage.objects set name = 'random/moved.webp' where name = 'projects/new.webp'$$, 'admin: cannot move objects outside the known folders');
select tests.ok(tests.affected($$delete from storage.objects where bucket_id = 'ilramdhan.dev' and name <> 'projects/existing.webp'$$) = 2, 'admin: deletes objects');

reset role;
