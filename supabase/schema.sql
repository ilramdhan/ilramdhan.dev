-- Users table (managed by Supabase Auth)
-- This script only sets up RLS policies for the auth.users table.
-- The table itself is created by Supabase Auth.

-- Profile table to store public user data
CREATE TABLE profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for profile
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profile FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profile FOR UPDATE USING (auth.uid() = id);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    image_url TEXT,
    project_url TEXT,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by everyone." ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert their own projects." ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects." ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects." ON projects FOR DELETE USING (auth.uid() = user_id);

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon_name TEXT, -- e.g., 'figma', 'react'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone." ON services FOR SELECT USING (true);
CREATE POLICY "Users can insert their own services." ON services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services." ON services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services." ON services FOR DELETE USING (auth.uid() = user_id);

-- Blogs table
CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for blogs
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blogs are viewable by everyone." ON blogs FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Users can view their own unpublished blogs." ON blogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own blogs." ON blogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blogs." ON blogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blogs." ON blogs FOR DELETE USING (auth.uid() = user_id);

-- Resume/Experience table
CREATE TABLE resume (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'education' or 'experience'
    title TEXT NOT NULL,
    institution TEXT, -- e.g., company or university
    start_date DATE,
    end_date DATE, -- can be null for current position
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for resume
ALTER TABLE resume ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resume entries are viewable by everyone." ON resume FOR SELECT USING (true);
CREATE POLICY "Users can insert their own resume entries." ON resume FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resume entries." ON resume FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resume entries." ON resume FOR DELETE USING (auth.uid() = user_id);

-- Messages/Contact table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- By default, no one can view messages. Only service_role can access it.
CREATE POLICY "Admin users can view messages." ON messages FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Anyone can send a message." ON messages FOR INSERT WITH CHECK (true);
-- To allow admin users to delete messages.
CREATE POLICY "Admin users can delete messages." ON messages FOR DELETE USING (auth.role() = 'service_role');