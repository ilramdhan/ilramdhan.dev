import React from 'react';
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

// Navigation Manager Component
function AppContent() {
  const { path } = useRouter();
  const { isAuthenticated } = useStore();

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
  if (path === '/contact') return <Page />; // Scroll to contact handled by hash in real app, here we just show home

  // Dynamic Routes
  if (path.startsWith('/projects/')) {
      const id = path.split('/projects/')[1];
      return <ProjectDetailPage id={id} />;
  }

  if (path.startsWith('/blog/')) {
      const id = path.split('/blog/')[1];
      return <BlogDetailPage id={id} />;
  }

  // Default to Home
  return <Page />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-indigo-500/30">
      <StoreProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </StoreProvider>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}