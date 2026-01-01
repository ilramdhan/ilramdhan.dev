-- Drop existing tables with cascade to remove dependent objects
DROP TABLE IF EXISTS public.profile CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.blogs CASCADE;
DROP TABLE IF EXISTS public.resume CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.tech_stack CASCADE;
DROP TABLE IF EXISTS public.blog_comments CASCADE;

-- 1. Profile / General Settings
CREATE TABLE public.profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    logo_text TEXT DEFAULT 'DevFolio',
    logo_url TEXT,
    display_name TEXT,
    badge_text TEXT,
    hero_title TEXT,
    short_description TEXT,
    detailed_bio TEXT,
    avatar_url TEXT,
    resume_url TEXT,
    address TEXT,
    footer_text TEXT,
    privacy_content TEXT,
    terms_content TEXT,
    social_links JSONB
);
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile is viewable by everyone." ON public.profile FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile." ON public.profile FOR UPDATE USING (auth.uid() = id);

-- 2. Projects Table
CREATE TABLE public.projects (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    short_description TEXT,
    content TEXT,
    images TEXT[],
    tech_stack TEXT[],
    tags TEXT[],
    demo_url TEXT,
    repo_url TEXT,
    is_featured BOOLEAN DEFAULT false
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by everyone." ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can manage their own projects." ON public.projects FOR ALL USING (auth.uid() = user_id);

-- 3. Blogs Table
CREATE TABLE public.blogs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT,
    images TEXT[],
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false
);
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blogs are viewable by everyone." ON public.blogs FOR SELECT USING (published_at <= now());
CREATE POLICY "Users can manage their own blogs." ON public.blogs FOR ALL USING (auth.uid() = user_id);

-- 4. Resume Table
CREATE TABLE public.resume (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    institution TEXT,
    period TEXT,
    description TEXT,
    gpa TEXT,
    tags TEXT[]
);
ALTER TABLE public.resume ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resume is viewable by everyone." ON public.resume FOR SELECT USING (true);
CREATE POLICY "Users can manage their own resume." ON public.resume FOR ALL USING (auth.uid() = user_id);

-- 5. Services Table
CREATE TABLE public.services (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon_name TEXT
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone." ON public.services FOR SELECT USING (true);
CREATE POLICY "Users can manage their own services." ON public.services FOR ALL USING (auth.uid() = user_id);

-- 6. Messages Table
CREATE TABLE public.messages (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a message." ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can manage messages." ON public.messages FOR ALL USING (auth.role() = 'authenticated');

-- 7. Certificates Table
CREATE TABLE public.certificates (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    issued_by TEXT,
    issued_date DATE,
    expiry_date DATE,
    credential_url TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificates are viewable by everyone." ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Users can manage their own certificates." ON public.certificates FOR ALL USING (auth.uid() = user_id);

-- 8. Tech Stack Table
CREATE TABLE public.tech_stack (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon_url TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tech_stack ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tech stack is viewable by everyone." ON public.tech_stack FOR SELECT USING (true);
CREATE POLICY "Users can manage their own tech stack." ON public.tech_stack FOR ALL USING (auth.uid() = user_id);

-- 9. Blog Comments Table
CREATE TABLE public.blog_comments (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER REFERENCES public.blogs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can comment." ON public.blog_comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Comments are viewable by everyone." ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Admin can manage comments." ON public.blog_comments FOR ALL USING (auth.role() = 'authenticated');

-- 10. Supabase Storage Bucket Policies
-- Drop existing policies to make the script idempotent
DROP POLICY IF EXISTS "Public read access for ilramdhan.dev" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage files in ilramdhan.dev" ON storage.objects;

-- Create policies for 'ilramdhan.dev' bucket
CREATE POLICY "Public read access for ilramdhan.dev"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ilramdhan.dev' );

CREATE POLICY "Authenticated users can manage files in ilramdhan.dev"
ON storage.objects FOR ALL
TO authenticated
WITH CHECK ( bucket_id = 'ilramdhan.dev' );
