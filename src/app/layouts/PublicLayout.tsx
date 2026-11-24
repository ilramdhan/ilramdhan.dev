import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/Link';
import { useT } from '@/i18n';
import { LocaleBanner } from '@/i18n/LocaleBanner';
import { profileQueries } from '@/features/profile/queries';
import { APP_COMMIT, releaseUrl, versionLabel } from '@/lib/version';
import { ScrollManager } from './ScrollManager';
import { ScrollToTop } from './ScrollToTop';

function Footer() {
  const { data: profile } = useQuery(profileQueries.detail());
  const t = useT();

  return (
    <footer className="bg-on-dark border-t border-slate-200 dark:bg-slate-950/90 dark:border-on-dark/5 py-12 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-slate-500 text-sm">{profile?.footer_text}</span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to="/privacy"
              className="text-slate-500 hover:text-slate-900 dark:hover:text-on-dark text-sm"
            >
              {t.footer.privacy}
            </Link>
            <Link
              to="/terms"
              className="text-slate-500 hover:text-slate-900 dark:hover:text-on-dark text-sm"
            >
              {t.footer.terms}
            </Link>
            <a
              href={releaseUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.footer.versionLabel(versionLabel(), APP_COMMIT)}
              data-testid="app-version"
              className="font-mono text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-on-dark"
            >
              {versionLabel()}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 antialiased selection:bg-indigo-500/30 flex flex-col">
      <LocaleBanner />
      <div className="flex-1">
        {/* Page chunks are lazy (T-24): keep the layout mounted and reserve the
            viewport height while one loads so the footer doesn't jump. */}
        {/* Keyed by path: each route fades in (opacity only, so fixed children and
            layout never shift; disabled under reduced motion). */}
        <div key={pathname} className="motion-safe:animate-page-in">
          <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <Footer />
      <ScrollManager />
      <ScrollToTop />
      <Toaster position="bottom-right" theme="system" />
    </div>
  );
}
