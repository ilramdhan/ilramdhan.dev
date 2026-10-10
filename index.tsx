import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminRoute } from './components/AdminRoute';
import { EnvErrorScreen } from './components/EnvErrorScreen';
import { AuthProvider } from './lib/auth';
import { envErrors } from './lib/env';
import App from './App';
import Page from './app/page';
import AdminPage from './app/admin';
import LoginPage from './app/login';
import ProjectsPage from './app/projects';
import ProjectDetailPage from './app/project-detail';
import BlogPage from './app/blog';
import BlogDetailPage from './app/blog-detail';
import AboutPage from './app/about';
import CertificatesPage from './app/certificates';
import PrivacyPage from './app/privacy';
import TermsPage from './app/terms';
import './global.css';

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Page />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:slug" element={<ProjectDetailPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogDetailPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {envErrors.length > 0 ? (
      <EnvErrorScreen errors={envErrors} />
    ) : (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    )}
  </React.StrictMode>,
);
