import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Database } from '../types';

type Project = Database['public']['Tables']['projects']['Row'] & {
    tags: string[];
};
type Message = Database['public']['Tables']['messages']['Row'];

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  published_at: string;
  is_featured: boolean;
  tags: string[];
  comments: { name: string; text: string; date: string }[];
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  tags?: string[]; // New field
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  period: string;
  gpa?: string; // New field
  description?: string; // New field
  tags?: string[]; // New field
}

export interface ProfileConfig {
  logo_text: string;
  logo_url: string;
  name: string;
  avatar_url: string;
  title: string;
  description: string;
  detailed_bio: string;
  address: string;
  resume_url: string;
  badge: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    instagram: string;
    youtube: string;
    whatsapp: string;
    mail: string;
    steam: string;
  };
}

const INITIAL_PROFILE: ProfileConfig = {
  logo_text: 'DevFolio',
  logo_url: '',
  name: 'DevFolio User',
  avatar_url: 'https://cdn.iconscout.com/icon/free/png-256/free-avatar-370-456322.png',
  title: 'Building digital products & experiences',
  description: 'I craft accessible, pixel-perfect, and performant web applications using modern architecture. Focused on React, Next.js, and Cloud Infrastructure.',
  detailed_bio: "I am a passionate software engineer with over 5 years of experience in building scalable web applications. I love solving complex problems and learning new technologies.",
  address: "Jakarta, Indonesia",
  resume_url: "#",
  badge: 'Full Stack Software Engineer',
  socials: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
    instagram: '',
    youtube: '',
    whatsapp: '',
    mail: '',
    steam: '',
  }
};

const INITIAL_EXPERIENCE: Experience[] = [
    { 
        id: '1', 
        role: 'Senior Frontend Engineer', 
        company: 'Tech Corp', 
        period: '2021 - Present', 
        description: 'Leading the frontend team and migrating legacy codebase to Next.js.',
        tags: ['React', 'Leadership', 'Architecture'] 
    },
    { 
        id: '2', 
        role: 'Web Developer', 
        company: 'Creative Studio', 
        period: '2019 - 2021', 
        description: 'Developed responsive websites for various clients using React and WordPress.',
        tags: ['WordPress', 'CSS', 'JavaScript'] 
    },
];

const INITIAL_EDUCATION: Education[] = [
    { 
        id: '1', 
        degree: 'B.S. Computer Science', 
        school: 'University of Technology', 
        period: '2015 - 2019',
        gpa: '3.8/4.0',
        description: 'Specialized in Software Engineering and Artificial Intelligence.',
        tags: ['Algorithms', 'Data Structures']
    },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'E-Commerce Dashboard',
    slug: 'ecommerce-dashboard',
    description: 'A comprehensive analytics dashboard for online retailers.',
    content: 'Full content...',
    tech_stack: ['Next.js', 'Supabase', 'Tremor', 'Tailwind'],
    tags: ['Fullstack', 'Dashboard'],
    demo_url: 'https://example.com',
    repo_url: 'https://github.com',
    thumbnail_url: 'https://picsum.photos/seed/1/600/337',
    is_featured: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'AI Content Generator',
    slug: 'ai-content-gen',
    description: 'SaaS platform leveraging LLMs.',
    content: 'Full content...',
    tech_stack: ['React', 'OpenAI', 'Stripe'],
    tags: ['AI', 'SaaS'],
    demo_url: 'https://example.com',
    repo_url: 'https://github.com',
    thumbnail_url: 'https://picsum.photos/seed/2/600/337',
    is_featured: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
   {
    id: '3',
    title: 'Portfolio V1',
    slug: 'portfolio-v1',
    description: 'My first portfolio site.',
    content: 'Full content...',
    tech_stack: ['HTML', 'CSS', 'JS'],
    tags: ['Frontend'],
    demo_url: '#',
    repo_url: '#',
    thumbnail_url: 'https://picsum.photos/seed/3/600/337',
    is_featured: false,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

const INITIAL_BLOGS: BlogPost[] = [
  {
    id: '1',
    title: 'Why I chose Next.js 15',
    slug: 'why-nextjs-15',
    excerpt: 'Exploring the new features of Next.js 15.',
    content: 'Content...',
    cover_image: 'https://picsum.photos/seed/blog1/800/400',
    published_at: new Date().toISOString(),
    is_featured: true,
    tags: ['Next.js'],
    comments: []
  },
];

interface StoreContextType {
  projects: Project[];
  posts: BlogPost[];
  messages: Message[];
  profile: ProfileConfig;
  experience: Experience[];
  education: Education[];
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  login: () => void;
  logout: () => void;
  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'created_at'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // Blog Actions
  addPost: (post: Omit<BlogPost, 'id' | 'comments'>) => void;
  updatePost: (id: string, updates: Partial<BlogPost>) => void;
  deletePost: (id: string) => void;
  addComment: (postId: string, comment: { name: string; text: string }) => void;
  // Profile & Resume Actions
  updateProfile: (config: ProfileConfig) => void;
  setExperience: (exp: Experience[]) => void;
  updateExperience: (id: string, updates: Partial<Experience>) => void; // New
  setEducation: (edu: Education[]) => void;
  updateEducation: (id: string, updates: Partial<Education>) => void; // New
  // Message Actions
  addMessage: (msg: Omit<Message, 'id' | 'created_at' | 'is_read'>) => void;
  markMessageRead: (id: string) => void;
  markAllMessagesRead: () => void;
  deleteMessage: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_BLOGS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<ProfileConfig>(INITIAL_PROFILE);
  const [experience, setExperience] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [education, setEducation] = useState<Education[]>(INITIAL_EDUCATION);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Projects
  const addProject = (project: Omit<Project, 'id' | 'created_at'>) => {
    const newProject: Project = { ...project, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
    setProjects([newProject, ...projects]);
  };
  const updateProject = (id: string, updates: Partial<Project>) => setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  const deleteProject = (id: string) => setProjects(projects.filter(p => p.id !== id));

  // Blogs
  const addPost = (post: Omit<BlogPost, 'id' | 'comments'>) => {
    const newPost: BlogPost = { ...post, id: Math.random().toString(36).substr(2, 9), comments: [] };
    setPosts([newPost, ...posts]);
  };
  const updatePost = (id: string, updates: Partial<BlogPost>) => setPosts(posts.map(p => p.id === id ? { ...p, ...updates } : p));
  const deletePost = (id: string) => setPosts(posts.filter(p => p.id !== id));
  const addComment = (postId: string, comment: { name: string; text: string }) => {
    setPosts(posts.map(post => post.id === postId ? { ...post, comments: [...post.comments, { ...comment, date: new Date().toISOString() }] } : post));
  };

  // Profile & Resume
  const updateProfile = (config: ProfileConfig) => setProfile(config);
  
  const updateExperience = (id: string, updates: Partial<Experience>) => {
    setExperience(experience.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    setEducation(education.map(edu => edu.id === id ? { ...edu, ...updates } : edu));
  };

  // Messages
  const addMessage = (msg: Omit<Message, 'id' | 'created_at' | 'is_read'>) => {
    const newMessage: Message = { ...msg, id: Math.random().toString(36).substr(2, 9), is_read: false, created_at: new Date().toISOString() };
    setMessages([newMessage, ...messages]);
  };
  const markMessageRead = (id: string) => setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
  const markAllMessagesRead = () => setMessages(messages.map(m => ({ ...m, is_read: true })));
  const deleteMessage = (id: string) => setMessages(messages.filter(m => m.id !== id));

  return (
    <StoreContext.Provider value={{ 
      projects, posts, messages, profile, experience, education,
      isAuthenticated, login, logout, 
      theme, toggleTheme,
      addProject, updateProject, deleteProject,
      addPost, updatePost, deletePost, addComment,
      updateProfile, setExperience, updateExperience, setEducation, updateEducation,
      addMessage, markMessageRead, markAllMessagesRead, deleteMessage
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}