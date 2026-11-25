import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { BrowserRouter, useLocation, useRoutes, type RouteObject } from 'react-router';
import { AdminRoute } from '@/app/AdminRoute';
import { RouteErrorBoundary } from '@/app/error/RouteError';
import PublicLayout from '@/app/layouts/PublicLayout';
import MotionOutlet from '@/components/motion/MotionOutlet';
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { setRoutePrefetcher } from '@/app/prefetch';
import { endPrerenderedView } from '@/lib/hooks';
import { LocaleContext, loadLocale } from '@/i18n';
import { splitLocale, type Locale } from '@/i18n/locale';
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
  const [mod] = await Promise.all([pageLoaders[key](), loadLocale(splitLocale(path).locale)]);
  loaded[key] = mod.default;
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
const ContactPage = page('contact');
const LoginPage = page('login');
const AdminPage = page('admin');
const NotFoundPage = page('notFound');

setRoutePrefetcher(loadRouteChunk);

/** Public pages, identical in every locale (slugs are shared). */
function publicChildren(locale: Locale): RouteObject[] {
  const children: RouteObject[] = [
    { index: true, element: <HomePage /> },
    { path: 'about', element: <AboutPage /> },
    { path: 'certificates', element: <CertificatesPage /> },
    { path: 'projects', element: <ProjectsPage /> },
    { path: 'projects/:slug', element: <ProjectDetailPage /> },
    { path: 'blog', element: <BlogPage /> },
    { path: 'blog/:slug', element: <BlogDetailPage /> },
    { path: 'privacy', element: <PrivacyPage /> },
    { path: 'terms', element: <TermsPage /> },
    { path: 'contact', element: <ContactPage /> },
  ];
  // Admin stays English-only: no /id/login, no /id/admin.
  if (locale === 'en') {
    children.push(
      { path: 'login', element: <LoginPage /> },
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },
    );
  }
  children.push({ path: '*', element: <NotFoundPage /> });
  return children;
}

// Dev-only motion preview (R3): not prerendered, not in the sitemap, tree-shaken out of production builds.
const MotionPreview =
  import.meta.env.DEV || import.meta.env.VITE_MOTION_PREVIEW === '1'
    ? lazy(() => import('@/components/motion/MotionPreview'))
    : null;

/**
 * One route object per locale: `/...` for `en`, `/id/...` for `id`. Pages sit inside MotionOutlet (the route
 * cross-fade: BrowserRouter runs navigations in startTransition, which React turns into view transitions).
 */
const ROUTES: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [{ element: <MotionOutlet />, children: publicChildren('en') }],
  },
  {
    path: '/id',
    element: <PublicLayout />,
    children: [{ element: <MotionOutlet />, children: publicChildren('id') }],
  },
  ...(MotionPreview
    ? [
        {
          path: '/__motion/*',
          element: (
            <Suspense fallback={null}>
              <MotionPreview />
            </Suspense>
          ),
        },
      ]
    : []),
];

/** The route tree; rendered inside `BrowserRouter` (client) or `StaticRouter` (prerender). */
export function GuardedRoutes() {
  const { pathname } = useLocation();
  const [firstPath] = useState(pathname);
  const { locale } = splitLocale(pathname);
  // During render (idempotent), not in an effect: the next page's components read the
  // flag while they render, before any effect would run.
  if (pathname !== firstPath) endPrerenderedView();
  // Interactive from here on (prerendered pages: hydrated). Read by the e2e suite.
  useEffect(() => document.documentElement.setAttribute('data-hydrated', ''), []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const routes = useRoutes(ROUTES);
  return (
    <LocaleContext.Provider value={locale}>
      <RouteErrorBoundary resetKey={pathname}>
        <SmoothScrollProvider>{routes}</SmoothScrollProvider>
      </RouteErrorBoundary>
    </LocaleContext.Provider>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <GuardedRoutes />
    </BrowserRouter>
  );
}
