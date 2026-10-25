import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useIsAdmin } from '@/lib/useIsAdmin';
import { profileQueries } from '@/features/profile/queries';
import { prefetchRoute } from '@/app/prefetch';
import { Img } from '@/components/ui/Img';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const { isAdmin } = useIsAdmin();

  const { data: profile, isLoading: isLoadingProfile } = useQuery(profileQueries.detail());

  // Compact + stronger blur/border once the page is scrolled 16px.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active-link pill: one element that slides between links (transform only).
  const linksRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const container = linksRef.current;
    const measure = () => {
      const active = container?.querySelector<HTMLElement>('[aria-current="page"]');
      const next = active
        ? {
            x: active.offsetLeft,
            y: active.offsetTop,
            w: active.offsetWidth,
            h: active.offsetHeight,
          }
        : null;
      setPill((prev) =>
        prev &&
        next &&
        prev.x === next.x &&
        prev.y === next.y &&
        prev.w === next.w &&
        prev.h === next.h
          ? prev
          : next,
      );
    };
    measure();
    window.addEventListener('resize', measure);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && container) {
      ro = new ResizeObserver(measure);
      ro.observe(container);
      const active = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (active) ro.observe(active);
    }
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [path, profile, isAdmin]);

  // Real links: `/#contact` is handled by ScrollManager (no timeouts, lands below the navbar).
  const isActive = (linkPath: string) => (linkPath.includes('#') ? false : path === linkPath);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Certificates', path: '/certificates' },
    { name: 'Projects', path: '/projects' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/#contact' },
  ];

  return (
    <nav
      data-scrolled={scrolled}
      className={`nav-glass fixed top-0 w-full z-50 border-b bg-white/95 dark:bg-slate-950/95 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 motion-safe:transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? 'border-slate-300 shadow-sm supports-[backdrop-filter]:bg-white/75 dark:border-white/10 dark:supports-[backdrop-filter]:bg-slate-950/70'
          : 'border-slate-200 supports-[backdrop-filter]:bg-white/60 dark:border-white/5 dark:supports-[backdrop-filter]:bg-slate-950/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between motion-safe:transition-[height] duration-200 ${scrolled ? 'h-14' : 'h-16'}`}
        >
          <Link to="/" aria-label="Home" className="flex-shrink-0" onClick={() => setIsOpen(false)}>
            {isLoadingProfile ? (
              <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded motion-safe:animate-pulse" />
            ) : profile?.logo_url ? (
              <Img
                src={profile.logo_url}
                alt={profile.logo_text || 'Home'}
                width={128}
                height={32}
                priority
                className="h-8 w-auto object-contain transition-all duration-300"
              />
            ) : (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                <span>{profile?.logo_text || 'DevFolio'}</span>
              </div>
            )}
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <div ref={linksRef} className="relative flex items-center space-x-4">
              {pill && (
                <span
                  aria-hidden="true"
                  data-testid="nav-pill"
                  className="absolute left-0 top-0 rounded-md bg-indigo-50 dark:bg-white/10 motion-safe:transition-[transform,width,height] motion-safe:duration-300 motion-safe:ease-out"
                  style={{
                    width: pill.w,
                    height: pill.h,
                    transform: `translate(${pill.x}px, ${pill.y}px)`,
                  }}
                />
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  onMouseEnter={() => prefetchRoute(link.path)}
                  onFocus={() => prefetchRoute(link.path)}
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-indigo-600 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-white/10 pl-6">
              <ThemeToggle />

              {/* No public "Sign In" button: /login stays reachable directly.
                  "Dashboard" is only shown to allowlisted admins (T-08). */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onMouseEnter={() => prefetchRoute('/admin')}
                  onFocus={() => prefetchRoute('/admin')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="-mr-2 flex lg:hidden items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="motion-safe:animate-menu-in lg:hidden border-t border-slate-200 dark:border-white/5">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                onTouchStart={() => prefetchRoute(link.path)}
                onFocus={() => prefetchRoute(link.path)}
                className="text-left text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium"
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 block px-3 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
