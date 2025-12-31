import React, { useEffect } from 'react';
import Page from './app/page';
import AdminPage from './app/admin';
import LoginPage from './app/login';
import ProjectsPage from './app/projects';
import ProjectDetailPage from './app/project-detail';
import BlogPage from './app/blog';
import BlogDetailPage from './app/blog-detail';
import { Toaster } from 'sonner';
import { RouterProvider, useRouter } from './lib/router';
import { StoreProvider, useStore } from './lib/store';

// Global Background Animation
function BackgroundBeams() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-950 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] animate-pulse" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-900/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[150px] animate-pulse" style={{ animationDelay: '4s' }} />
    </div>
  );
}

// Navigation Manager Component
function AppContent() {
  const { path } = useRouter();
  const { isAuthenticated } = useStore();

  // Scroll to contact section if path is /contact
  useEffect(() => {
    if (path === '/contact') {
      // Small delay to ensure render
      setTimeout(() => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [path]);

  if (path.startsWith('/admin')) {
    if (!isAuthenticated) return <LoginPage />;
    return <AdminPage />;
  }
  
  if (path === '/login') {
    if (isAuthenticated) return <AdminPage />;
    return <LoginPage />;
  }

  // Exact Match Routes
  if (path === '/projects') return <ProjectsPage />;
  if (path === '/blog') return <BlogPage />;
  
  // Dynamic Routes
  if (path.startsWith('/projects/')) {
      const id = path.split('/projects/')[1];
      return <ProjectDetailPage id={id} />;
  }

  if (path.startsWith('/blog/')) {
      const id = path.split('/blog/')[1];
      return <BlogDetailPage id={id} />;
  }

  // Default to Home (handles '/' and '/contact' rendering)
  return <Page />;
}

export default function App() {
  return (
    <div className="min-h-screen text-slate-50 antialiased selection:bg-indigo-500/30">
      <BackgroundBeams />
      <StoreProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </StoreProvider>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
