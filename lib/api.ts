import { supabase } from './supabase/client';
import { Database } from '../types';

// Extracting Row and Insert types for easier use
type Profile = Database['public']['Tables']['profile']['Row'];
type ProfileInsert = Database['public']['Tables']['profile']['Insert'];
type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type Blog = Database['public']['Tables']['blogs']['Row'];
type BlogInsert = Database['public']['Tables']['blogs']['Insert'];
type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type Resume = Database['public']['Tables']['resume']['Row'];
type ResumeInsert = Database['public']['Tables']['resume']['Insert'];
type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type Certificate = Database['public']['Tables']['certificates']['Row'];
type CertificateInsert = Database['public']['Tables']['certificates']['Insert'];
type TechStack = Database['public']['Tables']['tech_stack']['Row'];
type TechStackInsert = Database['public']['Tables']['tech_stack']['Insert'];
type BlogComment = Database['public']['Tables']['blog_comments']['Row'];
type BlogCommentInsert = Database['public']['Tables']['blog_comments']['Insert'];

// Helper to get current user session
const getUserId = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw new Error("Could not get user session.");
    if (!session?.user?.id) throw new Error("User not authenticated.");
    return session.user.id;
};

// --- Profile ---
export const getProfile = async () => {
  const { data, error } = await supabase.from('profile').select('*').single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateProfile = async (profileData: Partial<Profile>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('profile').update(profileData).eq('id', userId).select().single();
    if (error) throw new Error(error.message);
    return data;
}

// --- Resume (Experience & Education) ---
export const getResume = async (type: 'experience' | 'education') => {
    const { data, error } = await supabase.from('resume').select('*').eq('type', type).order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
}

export const addResumeItem = async (item: Omit<ResumeInsert, 'user_id'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('resume').insert({ ...item, user_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const updateResumeItem = async (updates: Partial<Resume> & { id: number }) => {
    const { data, error } = await supabase.from('resume').update(updates).eq('id', updates.id).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const deleteResumeItem = async (id: number) => {
    const { error } = await supabase.from('resume').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// --- Services ---
export const getServices = async () => {
    const { data, error } = await supabase.from('services').select('*').order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
}

export const addService = async (service: Omit<ServiceInsert, 'user_id'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('services').insert({ ...service, user_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const updateService = async (updates: Partial<Service> & { id: number }) => {
    const { data, error } = await supabase.from('services').update(updates).eq('id', updates.id).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const deleteService = async (id: number) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// --- Projects ---
export const getProjects = async ({ page = 1, limit = 6, tag }: { page?: number, limit?: number, tag?: string | null }) => {
    let query = supabase.from('projects').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (tag) query = query.contains('tags', [tag]);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data, count: count ?? 0 };
};

export const addProject = async (project: Omit<ProjectInsert, 'user_id'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('projects').insert({ ...project, user_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const updateProject = async (updates: Partial<Project> & { id: number }) => {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', updates.id).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const deleteProject = async (id: number) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export const getProjectTags = async () => {
    const { data, error } = await supabase.from('projects').select('tags');
    if (error) throw new Error(error.message);
    const allTags = Array.from(new Set(data.flatMap(p => p.tags || [])));
    return allTags;
};

export const getProjectBySlug = async (slug: string) => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();
        
    if (error) throw new Error(error.message);
    return data;
};

// --- Blogs ---
export const getBlogs = async ({ page = 1, limit = 6, query: searchQuery }: { page?: number, limit?: number, query?: string }) => {
    let query = supabase.from('blogs').select('*', { count: 'exact' }).order('published_at', { ascending: false });
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data, count: count ?? 0 };
};

export const getBlogBySlug = async (slug: string) => {
    const { data, error } = await supabase.from('blogs').select('*').eq('slug', slug).single();
    if (error) throw new Error(error.message);
    return data;
};

export const getBlogTags = async () => {
    const { data, error } = await supabase.from('blogs').select('tags');
    if (error) throw new Error(error.message);
    const allTags = Array.from(new Set(data.flatMap(b => b.tags || [])));
    return allTags;
};

export const addBlog = async (blog: Omit<BlogInsert, 'user_id'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('blogs').insert({ ...blog, user_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const updateBlog = async (updates: Partial<Blog> & { id: number }) => {
    const { data, error } = await supabase.from('blogs').update(updates).eq('id', updates.id).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const deleteBlog = async (id: number) => {
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export const addComment = async ({ postId, name, text }: { postId: number, name: string, text: string }) => {
    const { data, error } = await supabase.from('blog_comments').insert({ blog_id: postId, name, content: text }).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const getComments = async (postId: number) => {
    const { data, error } = await supabase.from('blog_comments').select('*').eq('blog_id', postId).order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
}

// --- Messages ---
export const getMessages = async () => {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
}

export const addMessage = async (message: MessageInsert) => {
    const { data, error } = await supabase.from('messages').insert(message).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const deleteMessage = async (id: number) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export const markMessageAsRead = async (id: number) => {
    const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const markAllMessagesAsRead = async () => {
    const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('is_read', false).select();
    if (error) throw new Error(error.message);
    return data;
}

// --- Featured Items ---
export const getFeaturedProjects = async () => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(3);
    
    if (error) throw new Error(error.message);
    return data;
};

export const getFeaturedBlogs = async () => {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

    if (error) throw new Error(error.message);
    return data;
};

// --- Certificates ---
export const getCertificates = async () => {
    const { data, error } = await supabase.from('certificates').select('*').order('issued_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
}

export const addCertificate = async (cert: Omit<CertificateInsert, 'user_id'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('certificates').insert({ ...cert, user_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const updateCertificate = async (updates: Partial<Certificate> & { id: number }) => {
    const { data, error } = await supabase.from('certificates').update(updates).eq('id', updates.id).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const deleteCertificate = async (id: number) => {
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// --- Tech Stack ---
export const getTechStack = async () => {
    const { data, error } = await supabase.from('tech_stack').select('*').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
}

export const addTechStack = async (tech: Omit<TechStackInsert, 'user_id'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('tech_stack').insert({ ...tech, user_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const updateTechStack = async (updates: Partial<TechStack> & { id: number }) => {
    const { data, error } = await supabase.from('tech_stack').update(updates).eq('id', updates.id).select().single();
    if (error) throw new Error(error.message);
    return data;
}

export const deleteTechStack = async (id: number) => {
    const { error } = await supabase.from('tech_stack').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
