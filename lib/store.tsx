import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Database } from '../types';

type Project = Database['public']['Tables']['projects']['Row'] & {
    tags: string[]; // Add tags support
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
  is_featured: boolean; // Add featured support
  tags: string[]; // Add tags support
  comments: { name: string; text: string; date: string }[];
}

export interface ProfileConfig {
  name: string;
  avatar_url: string; // Add avatar support
  title: string;
  description: string;
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
  name: 'DevFolio User',
  avatar_url: 'https://cdn.iconscout.com/icon/free/png-256/free-avatar-370-456322.png',
  title: 'Building digital products & experiences',
  description: 'I craft accessible, pixel-perfect, and performant web applications using modern architecture. Focused on React, Next.js, and Cloud Infrastructure.',
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

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'E-Commerce Dashboard',
    slug: 'ecommerce-dashboard',
    description: 'A comprehensive analytics dashboard for online retailers featuring real-time data visualization and inventory management.',
    content: '## Overview\nThis project was built to solve the problem of fragmented data sources in e-commerce.\n\n### Key Features\n- Real-time tracking\n- Inventory management\n- Sales analytics',
    tech_stack: ['Next.js', 'Supabase', 'Tremor', 'Tailwind'],
    tags: ['Fullstack', 'Dashboard', 'Analytics'],
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
    description: 'SaaS platform leveraging LLMs to help marketers generate blog posts.',
    content: '## Tech Stack\nWe used OpenAI API combined with Next.js Edge functions for minimal latency.',
    tech_stack: ['React', 'OpenAI', 'Stripe', 'Node.js'],
    tags: ['AI', 'SaaS', 'React'],
    demo_url: 'https://example.com',
    repo_url: 'https://github.com',
    thumbnail_url: 'https://picsum.photos/seed/2/600/337',
    is_featured: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

const INITIAL_BLOGS: BlogPost[] = [
  {
    id: '1',
    title: 'Why I chose Next.js 15 for my next project',
    slug: 'why-nextjs-15',
    excerpt: 'Exploring the new features of Next.js 15 including Server Actions and Partial Prerendering.',
    content: 'Next.js 15 brings a lot of improvements to the table...',
    cover_image: 'https://picsum.photos/seed/blog1/800/400',
    published_at: new Date().toISOString(),
    is_featured: true,
    tags: ['Next.js', 'React', 'Web Dev'],
    comments: [
        { name: 'Alice', text: 'Great article!', date: new Date().toISOString() }
    ]
  },
  {
    id: '2',
    title: 'Mastering Tailwind CSS',
    slug: 'mastering-tailwind',
    excerpt: 'Tips and tricks to speed up your styling workflow with utility classes.',
    content: 'Tailwind CSS is a utility-first CSS framework...',
    cover_image: 'https://picsum.photos/seed/blog2/800/400',
    published_at: new Date().toISOString(),
    is_featured: false,
    tags: ['CSS', 'Design', 'Frontend'],
    comments: []
  }
];

interface StoreContextType {
  projects: Project[];
  posts: BlogPost[];
  messages: Message[];
  profile: ProfileConfig;
  isAuthenticated: boolean;
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
  // Profile Actions
  updateProfile: (config: ProfileConfig) => void;
  // Message Actions
  addMessage: (msg: Omit<Message, 'id' | 'created_at' | 'is_read'>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_BLOGS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<ProfileConfig>(INITIAL_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  // Projects
  const addProject = (project: Omit<Project, 'id' | 'created_at'>) => {
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    };
    setProjects([newProject, ...projects]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  // Blogs
  const addPost = (post: Omit<BlogPost, 'id' | 'comments'>) => {
    const newPost: BlogPost = {
      ...post,
      id: Math.random().toString(36).substr(2, 9),
      comments: []
    };
    setPosts([newPost, ...posts]);
  };

  const updatePost = (id: string, updates: Partial<BlogPost>) => {
    setPosts(posts.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePost = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  const addComment = (postId: string, comment: { name: string; text: string }) => {
    setPosts(posts.map(post => {
        if (post.id === postId) {
            return {
                ...post,
                comments: [...post.comments, { ...comment, date: new Date().toISOString() }]
            };
        }
        return post;
    }));
  };

  // Profile
  const updateProfile = (config: ProfileConfig) => {
    setProfile(config);
  };

  // Messages
  const addMessage = (msg: Omit<Message, 'id' | 'created_at' | 'is_read'>) => {
    const newMessage: Message = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages([newMessage, ...messages]);
  };

  return (
    <StoreContext.Provider value={{ 
      projects, 
      posts,
      messages, 
      profile,
      isAuthenticated, 
      login, 
      logout, 
      addProject, 
      updateProject,
      deleteProject,
      addPost,
      updatePost,
      deletePost,
      addComment,
      updateProfile,
      addMessage 
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
