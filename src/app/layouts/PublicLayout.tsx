import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { useT } from '@/i18n';
import { LocaleBanner } from '@/i18n/LocaleBanner';
import { cn } from '@/lib/utils';
import { Footer, RevealStage } from './chrome/Footer';
import { useNavItems } from './chrome/nav-items';
import { Navbar } from './Navbar';
import { ScrollManager } from './ScrollManager';

/**
 * Site chrome (mutugading SiteChrome): skip link, the fixed nav, `<main id="main">` (padded by the 44px nav) inside
 * the reveal curtain, and the parchment footer under it. Nav and footer sit outside the route cross-fade.
 */
export default function App() {
  const t = useT();
  const items = useNavItems();
  // Admin and login never had the site nav (the admin has its own fixed sidebar).
  const bare = /^\/(admin|login)(\/|$)/.test(useLocation().pathname);
  return (
    <div className="flex min-h-screen flex-col antialiased">
      {/* First focusable element. A plain hash change would reach the router as a POP; move focus instead. */}
      <a
        href="#main"
        onClick={(e) => {
          const main = document.getElementById('main');
          if (!main) return;
          e.preventDefault();
          main.focus();
        }}
        className="sr-only z-[100] rounded-full bg-ink px-4 py-3 text-caption text-white focus:not-sr-only focus:fixed focus:top-1 focus:left-3 focus:inline-flex focus:min-h-11 focus:items-center"
      >
        {t.nav.skipToContent}
      </a>
      {bare ? null : <Navbar />}
      <LocaleBanner />
      <RevealStage footer={<Footer items={items} />}>
        <main
          id="main"
          tabIndex={-1}
          className={cn('flex-1 outline-none', !bare && 'pt-(--nav-h)')}
        >
          {/* Page chunks are lazy (T-24): reserve the viewport height while one loads so the footer doesn't jump. */}
          <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
            <Outlet />
          </Suspense>
        </main>
      </RevealStage>
      <ScrollManager />
      <Toaster position="bottom-right" theme="system" />
    </div>
  );
}
