-- 1. Profile / General Settings
-- This table will now store all global site settings.
-- We assume only one row will ever exist in this table.
CREATE TABLE profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Hero Section & General Info
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
    
    -- Footer & Legal
    footer_text TEXT,
    privacy_content TEXT,
    terms_content TEXT,
    
    -- Social Links (stored as JSONB for flexibility)
    social_links JSONB
);
-- RLS for profile
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile is viewable by everyone." ON profile FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile." ON profile FOR UPDATE USING (auth.uid() = id);
-- Note: Insertion is handled by a trigger, but as it's a single-user site, manual insertion is also fine.


-- 2. Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    short_description TEXT,
    content TEXT, -- For Markdown content
    images TEXT[], -- Array of image URLs from Supabase Storage
    tech_stack TEXT[],
    tags TEXT[],
    demo_url TEXT,
    repo_url TEXT,
    is_featured BOOLEAN DEFAULT false
);
-- RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by everyone." ON projects FOR SELECT USING (true);
CREATE POLICY "Users can manage their own projects." ON projects FOR ALL USING (auth.uid() = user_id);


-- 3. Blogs Table
CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT, -- For Markdown content
    images TEXT[], -- Array of image URLs from Supabase Storage
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false
);
-- RLS for blogs
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blogs are viewable by everyone." ON blogs FOR SELECT USING (published_at <= now());
CREATE POLICY "Users can manage their own blogs." ON blogs FOR ALL USING (auth.uid() = user_id);


-- 4. Resume Table (for Experience & Education)
CREATE TABLE resume (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL, -- 'experience' or 'education'
    title TEXT NOT NULL, -- Role or Degree
    institution TEXT, -- Company or School
    period TEXT,
    description TEXT,
    gpa TEXT, -- Specific to education, can be null
    tags TEXT[]
);
-- RLS for resume
ALTER TABLE resume ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resume is viewable by everyone." ON resume FOR SELECT USING (true);
CREATE POLICY "Users can manage their own resume." ON resume FOR ALL USING (auth.uid() = user_id);


-- 5. Services Table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    icon_name TEXT -- e.g., 'code', 'smartphone'
);
-- RLS for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone." ON services FOR SELECT USING (true);
CREATE POLICY "Users can manage their own services." ON services FOR ALL USING (auth.uid() = user_id);


-- 6. Messages Table (for contact form)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false
);
-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a message." ON messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can select messages." ON messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update messages." ON messages FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete messages." ON messages FOR DELETE USING (auth.role() = 'authenticated');


-- 7. Supabase Storage Bucket Policies
-- Policies for 'ilramdhan.dev' bucket
CREATE POLICY "Public read access for ilramdhan.dev"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ilramdhan.dev' );

CREATE POLICY "Authenticated users can manage files in ilramdhan.dev"
ON storage.objects FOR ALL
TO authenticated
WITH CHECK ( bucket_id = 'ilramdhan.dev' );
