import { Link } from 'react-router';
import { Navbar } from '@/app/layouts/Navbar';
import { EmptyState } from '@/components/ui/PageState';
import { Seo } from '@/components/seo/Seo';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
];

/** 404 page: rendered for unknown URLs and for unknown project/blog slugs. */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <Seo title="Page not found" noindex />
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2">Page not found</h1>
        <EmptyState className="py-6">
          The page you are looking for does not exist or has been moved.
        </EmptyState>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
