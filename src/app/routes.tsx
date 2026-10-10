import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from '@/app/AdminRoute';
import PublicLayout from '@/app/layouts/PublicLayout';
import Page from '@/pages/home';
import LoginPage from '@/pages/login';
import ProjectsPage from '@/pages/projects';
import ProjectDetailPage from '@/pages/project-detail';
import BlogPage from '@/pages/blog';
import BlogDetailPage from '@/pages/blog-detail';
import AboutPage from '@/pages/about';
import CertificatesPage from '@/pages/certificates';
import PrivacyPage from '@/pages/privacy';
import TermsPage from '@/pages/terms';

// Admin-only code (dashboard, CRUD forms, react-hook-form) stays out of the public bundle.
const AdminPage = lazy(() => import('@/pages/admin'));

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
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
                <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                  <AdminPage />
                </Suspense>
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
