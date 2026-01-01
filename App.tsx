import React, { useEffect } from 'react';
import Page from './app/page';
import AdminPage from './app/admin';
import LoginPage from './app/login';
import ProjectsPage from './app/projects';
import ProjectDetailPage from './app/project-detail';
import BlogPage from './app/blog';
import BlogDetailPage from './app/blog-detail';
import AboutPage from './app/about';
import PrivacyPage from './app/privacy';
import TermsPage from './app/terms';
import { Toaster } from 'sonner';
import { RouterProvider, useRouter } from './lib/router';
import { StoreProvider, useStore } from './lib/store';
import { ScrollToTop } from './components/ScrollToTop';

// Global Background Animation
function BackgroundBeams() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-white dark:bg-slate-950 pointer-events-none transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-900/10 blur-[120px] animate-pulse" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-500/10 dark:bg-purple-900/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-900/10 blur-[150px] animate-pulse" style={{ animationDelay: '4s' }} />
    </div>
  );
}

// Navigation Manager Component
function AppContent() {
  const { path } = useRouter();
  const { isAuthenticated, theme } = useStore();

  // Initialize theme on mount to ensure class is present
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Scroll to contact section if path is /contact
  useEffect(() => {
    if (path === '/contact') {
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

  // Routes
  if (path === '/projects') return <ProjectsPage />;
  if (path === '/blog') return <BlogPage />;
  if (path === '/about') return <AboutPage />;
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/terms') return <TermsPage />;
  
  // Dynamic Routes
  if (path.startsWith('/projects/')) {
      const id = path.split('/projects/')[1];
      return <ProjectDetailPage id={id} />;
  }

  if (path.startsWith('/blog/')) {
      const id = path.split('/blog/')[1];
      return <BlogDetailPage id={id} />;
  }

  return <Page />;
}

export default function App() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 antialiased selection:bg-indigo-500/30">
      <StoreProvider>
        <BackgroundBeams />
        <RouterProvider>
          <AppContent />
          <ScrollToTop />
        </RouterProvider>
      </StoreProvider>
      <Toaster position="bottom-right" theme="system" />
    </div>
  );
}