/**
 * Lazy page modules (T-24). Every page is its own chunk so a visitor only downloads
 * the code of the route they open; `loadRouteChunk` warms a chunk on link hover/focus
 * so the following navigation renders without a visible loading state.
 */
export const pageLoaders = {
  home: () => import('@/pages/home'),
  about: () => import('@/pages/about'),
  certificates: () => import('@/pages/certificates'),
  projects: () => import('@/pages/projects'),
  projectDetail: () => import('@/pages/project-detail'),
  blog: () => import('@/pages/blog'),
  blogDetail: () => import('@/pages/blog-detail'),
  privacy: () => import('@/pages/privacy'),
  terms: () => import('@/pages/terms'),
  login: () => import('@/pages/login'),
  admin: () => import('@/pages/admin'),
  notFound: () => import('@/pages/not-found'),
} as const;

type PageKey = keyof typeof pageLoaders;

/** Maps a pathname (or `/#section` link) to the page chunk that renders it. */
export function pageForPath(path: string): PageKey {
  const pathname = path.split(/[?#]/)[0] || '/';
  if (pathname === '/') return 'home';
  const [first, second] = pathname.split('/').filter(Boolean);
  switch (first) {
    case 'about':
      return 'about';
    case 'certificates':
      return 'certificates';
    case 'projects':
      return second ? 'projectDetail' : 'projects';
    case 'blog':
      return second ? 'blogDetail' : 'blog';
    case 'privacy':
      return 'privacy';
    case 'terms':
      return 'terms';
    case 'login':
      return 'login';
    case 'admin':
      return 'admin';
    default:
      return 'notFound';
  }
}

const prefetched = new Set<PageKey>();

/** Starts downloading the chunk for `path` once; failures are ignored (the route retries). */
export function loadRouteChunk(path: string): void {
  const key = pageForPath(path);
  if (prefetched.has(key)) return;
  prefetched.add(key);
  pageLoaders[key]().catch(() => prefetched.delete(key));
}
