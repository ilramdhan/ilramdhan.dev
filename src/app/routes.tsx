import { lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AdminRoute } from '@/app/AdminRoute';
import { RouteErrorBoundary } from '@/app/error/RouteError';
import PublicLayout from '@/app/layouts/PublicLayout';
import { setRoutePrefetcher } from '@/app/prefetch';
import { loadRouteChunk, pageLoaders } from '@/app/route-modules';

// Every page is its own chunk (T-24); admin-only code (dashboard, CRUD forms) stays
// out of the public bundle entirely.
const HomePage = lazy(pageLoaders.home);
const AboutPage = lazy(pageLoaders.about);
const CertificatesPage = lazy(pageLoaders.certificates);
const ProjectsPage = lazy(pageLoaders.projects);
const ProjectDetailPage = lazy(pageLoaders.projectDetail);
const BlogPage = lazy(pageLoaders.blog);
const BlogDetailPage = lazy(pageLoaders.blogDetail);
const PrivacyPage = lazy(pageLoaders.privacy);
const TermsPage = lazy(pageLoaders.terms);
const LoginPage = lazy(pageLoaders.login);
const AdminPage = lazy(pageLoaders.admin);
const NotFoundPage = lazy(pageLoaders.notFound);

setRoutePrefetcher(loadRouteChunk);

function GuardedRoutes() {
  const { pathname } = useLocation();
  return (
    <RouteErrorBoundary resetKey={pathname}>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </RouteErrorBoundary>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <GuardedRoutes />
    </BrowserRouter>
  );
}
