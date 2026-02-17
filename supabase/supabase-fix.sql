-- ============================================================================
-- Supabase RLS Security & Performance Fix Migration
-- ============================================================================
-- SAFE TO RUN: This script only modifies RLS policies. 
-- It does NOT drop tables, delete data, or alter table structures.
-- All existing data remains intact.
-- ============================================================================

-- ============================================================================
-- 1. PROFILE — Performance fix
-- ============================================================================
DROP POLICY IF EXISTS "Profile is viewable by everyone." ON public.profile;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profile;

CREATE POLICY "Profile is viewable by everyone." ON public.profile
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." ON public.profile
  FOR UPDATE USING ((select auth.uid()) = id);

-- ============================================================================
-- 2. PROJECTS — Performance fix (use subquery for auth.uid())
-- ============================================================================
DROP POLICY IF EXISTS "Projects are viewable by everyone." ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects." ON public.projects;

CREATE POLICY "Projects are viewable by everyone." ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own projects." ON public.projects
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 3. BLOGS — Performance fix
-- ============================================================================
DROP POLICY IF EXISTS "Published blogs are viewable by everyone." ON public.blogs;
DROP POLICY IF EXISTS "Users can manage their own blogs." ON public.blogs;

CREATE POLICY "Published blogs are viewable by everyone." ON public.blogs
  FOR SELECT USING (published_at <= now());

CREATE POLICY "Users can manage their own blogs." ON public.blogs
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 4. RESUME — Performance fix
-- ============================================================================
DROP POLICY IF EXISTS "Resume is viewable by everyone." ON public.resume;
DROP POLICY IF EXISTS "Users can manage their own resume." ON public.resume;

CREATE POLICY "Resume is viewable by everyone." ON public.resume
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own resume." ON public.resume
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 5. SERVICES — Performance fix
-- ============================================================================
DROP POLICY IF EXISTS "Services are viewable by everyone." ON public.services;
DROP POLICY IF EXISTS "Users can manage their own services." ON public.services;

CREATE POLICY "Services are viewable by everyone." ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own services." ON public.services
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 6. MESSAGES — Security hardening + Performance fix
-- Consolidate multiple permissive policies into clearer ones
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can send a message." ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can manage messages." ON public.messages;

-- Allow anyone (including anonymous) to insert messages
CREATE POLICY "Anyone can send a message." ON public.messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) <= 100
    AND length(email) <= 320
    AND length(message) <= 5000
  );

-- Only authenticated users can view/update/delete messages
CREATE POLICY "Authenticated users can view messages." ON public.messages
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update messages." ON public.messages
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete messages." ON public.messages
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- ============================================================================
-- 7. CERTIFICATES — Performance fix
-- ============================================================================
DROP POLICY IF EXISTS "Certificates are viewable by everyone." ON public.certificates;
DROP POLICY IF EXISTS "Users can manage their own certificates." ON public.certificates;

CREATE POLICY "Certificates are viewable by everyone." ON public.certificates
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own certificates." ON public.certificates
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 8. TECH STACK — Performance fix
-- ============================================================================
DROP POLICY IF EXISTS "Tech stack is viewable by everyone." ON public.tech_stack;
DROP POLICY IF EXISTS "Users can manage their own tech stack." ON public.tech_stack;

CREATE POLICY "Tech stack is viewable by everyone." ON public.tech_stack
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own tech stack." ON public.tech_stack
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 9. BLOG COMMENTS — Security hardening + Performance fix
-- Consolidate into specific action policies instead of overlapping FOR ALL
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can comment." ON public.blog_comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.blog_comments;
DROP POLICY IF EXISTS "Admin can manage comments." ON public.blog_comments;

-- Anyone can insert comments (with length constraints)
CREATE POLICY "Anyone can comment." ON public.blog_comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) <= 100
    AND length(content) <= 2000
  );

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone." ON public.blog_comments
  FOR SELECT USING (true);

-- Only authenticated users can update/delete comments
CREATE POLICY "Admin can update comments." ON public.blog_comments
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Admin can delete comments." ON public.blog_comments
  FOR DELETE USING ((select auth.role()) = 'authenticated');
