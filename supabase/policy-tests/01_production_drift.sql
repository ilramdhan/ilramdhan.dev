-- Recreates objects that exist on production but not in the repo (applied by
-- the runner right after the baseline migration), so the tests prove that the
-- later migrations replace the extra permissive policies and leave unrelated
-- tables / buckets alone.

-- Extra "Public can read <table>" policies (USING true) on repo tables.
create policy "Public can read profile" on public.profile for select to anon, authenticated using (true);
create policy "Public can read projects" on public.projects for select to anon, authenticated using (true);
create policy "Public can read blogs" on public.blogs for select to anon, authenticated using (true);
create policy "Public can read resume" on public.resume for select to anon, authenticated using (true);
create policy "Public can read services" on public.services for select to anon, authenticated using (true);
create policy "Public can read certificates" on public.certificates for select to anon, authenticated using (true);
create policy "Public can read tech_stack" on public.tech_stack for select to anon, authenticated using (true);

-- Extra storage policies on the app bucket.
create policy "Public read access for avatars" on storage.objects
  for select using (bucket_id = 'ilramdhan.dev');
create policy "Users can upload to their own folder" on storage.objects
  for insert with check (bucket_id = 'ilramdhan.dev' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "Users can manage their own files" on storage.objects
  for update using (bucket_id = 'ilramdhan.dev' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "Users can delete their own files" on storage.objects
  for delete using (bucket_id = 'ilramdhan.dev' and (storage.foldername(name))[1] = (auth.uid())::text);

-- Something this repo does not manage: must survive untouched.
create table public.faq (id serial primary key, question text);
alter table public.faq enable row level security;
create policy "faq readable" on public.faq for select using (true);
insert into storage.buckets (id, name, public) values ('other-bucket', 'other-bucket', false);
create policy "other bucket uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'other-bucket');
