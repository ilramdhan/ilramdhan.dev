import React, { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '@/features/profile/queries';
import { releaseUrl, versionAriaLabel, versionLabel } from '@/lib/version';
import { ScrollManager } from './ScrollManager';
import { ScrollToTop } from './ScrollToTop';

/**
 * Site-wide decorative background (T-28): the same soft indigo/purple/blue glow the
 * old blurred, pulsing blobs gave, painted once as static radial gradients. No
 * `filter: blur`, no animation, so nothing repaints on scroll or idle.
 */
function BackgroundGlow() {
  return (
    <div
      aria-hidden="true"
      className="site-glow fixed inset-0 z-[-1] bg-white dark:bg-slate-950 pointer-events-none transition-colors duration-300"
    />
  );
}

function Footer() {
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQueries.detail());

  return (
    <footer className="bg-white border-t border-slate-200 dark:bg-slate-950/90 dark:border-white/5 py-12 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-slate-500 text-sm">{profile?.footer_text}</span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <button
              onClick={() => navigate('/privacy')}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm"
            >
              Terms of Service
            </button>
            <a
              href={releaseUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={versionAriaLabel()}
              data-testid="app-version"
              className="font-mono text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
      <BackgroundGlow />
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
