/** Public routes and the H1 each must render with the mock dataset. */
export interface PublicRoute {
  name: string;
  path: string;
  /** Expected H1 text; `null` = any non-empty H1 . */
  h1: string | RegExp | null;
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  { name: 'home', path: '/', h1: 'Dummy Dev' },
  { name: 'about', path: '/about', h1: 'Dummy Dev' },
  { name: 'projects', path: '/projects', h1: 'All Projects' },
  { name: 'project detail', path: '/projects/project-1', h1: 'Project 1' },
  {
    name: 'project detail (long content)',
    path: '/projects/long-content',
    h1: /^Internationalization with/,
  },
  { name: 'blog', path: '/blog', h1: 'Writings' },
  { name: 'blog detail', path: '/blog/blog-post-1', h1: 'Blog Post 1' },
  {
    name: 'blog detail (long content)',
    path: '/blog/long-content',
    h1: /^Internationalization with/,
  },
  { name: 'certificates', path: '/certificates', h1: 'Certificates' },
  { name: 'privacy', path: '/privacy', h1: 'Privacy Policy' },
  { name: 'terms', path: '/terms', h1: 'Terms of Service' },
  { name: 'login', path: '/login', h1: 'Admin login' },
];
