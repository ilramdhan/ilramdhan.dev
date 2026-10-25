import { lazy, useEffect, useRef, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { AdminRoute } from '@/app/AdminRoute';
import { RouteErrorBoundary } from '@/app/error/RouteError';
import PublicLayout from '@/app/layouts/PublicLayout';
import { setRoutePrefetcher } from '@/app/prefetch';
import { endPrerenderedView } from '@/lib/hooks';
import { loadRouteChunk, pageForPath, pageLoaders, type PageKey } from '@/app/route-modules';

// Every page is its own chunk (T-24); admin-only code (dashboard, CRUD forms) stays
// out of the public bundle entirely.
const loaded: Partial<Record<PageKey, ComponentType>> = {};

/**
 * `lazy()` that renders the module directly once `preloadPage` has loaded it. Hydrating a
 * prerendered page (T-35) must not suspend: a boundary that is still suspended when the
 * first post-hydration update arrives is thrown away and client-rendered.
 */
function page(key: PageKey): ComponentType {
  const Lazy = lazy(async () => {
    const mod = await pageLoaders[key]();
    loaded[key] = mod.default;
    return mod;
  });
  return function Page() {
    const Loaded = loaded[key];
    return Loaded ? <Loaded /> : <Lazy />;
  };
}

/** Loads the page chunk for `path` so the first render doesn't suspend. */
// eslint-disable-next-line react-refresh/only-export-components -- shares the page registry with the route tree
export async function preloadPage(path: string): Promise<void> {
  const key = pageForPath(path);
  loaded[key] = (await pageLoaders[key]()).default;
}

const HomePage = page('home');
const AboutPage = page('about');
const CertificatesPage = page('certificates');
const ProjectsPage = page('projects');
const ProjectDetailPage = page('projectDetail');
const BlogPage = page('blog');
const BlogDetailPage = page('blogDetail');
const PrivacyPage = page('privacy');
const TermsPage = page('terms');
const LoginPage = page('login');
const AdminPage = page('admin');
const NotFoundPage = page('notFound');

setRoutePrefetcher(loadRouteChunk);

/** The route tree; rendered inside `BrowserRouter` (client) or `StaticRouter` (prerender). */
export function GuardedRoutes() {
  const { pathname } = useLocation();
  const firstPath = useRef(pathname);
  // During render (idempotent), not in an effect: the next page's components read the
  // flag while they render, before any effect would run.
  if (pathname !== firstPath.current) endPrerenderedView();
  // Interactive from here on (prerendered pages: hydrated). Read by the e2e suite.
  useEffect(() => document.documentElement.setAttribute('data-hydrated', ''), []);
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
    <BrowserRouter>
      <GuardedRoutes />
    </BrowserRouter>
  );
}
