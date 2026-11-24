import { useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';
import { useLenis } from '@/components/motion/SmoothScrollProvider';

const positions = new Map<string, number>();

/** Retries `attempt` on animation frames until it returns true or `ms` elapsed (lazy chunks / data). */
function retryFor(ms: number, attempt: () => boolean): () => void {
  let raf = 0;
  const end = performance.now() + ms;
  const tick = () => {
    if (attempt() || performance.now() > end) return;
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => cancelAnimationFrame(raf);
}

/**
 * Scroll behaviour on navigation (T-30), through Lenis when it runs (R4):
 * - POP (back/forward): restore the position saved for that history entry once the page is tall enough.
 * - PUSH/REPLACE with a hash: scroll to the target as soon as it exists. `html { scroll-padding-top }` keeps it below
 *   the 44px nav; Lenis and native scrolling both honour it. Smooth within the same page, instant across pages.
 * - Otherwise: top of the page.
 * Lenis (fine pointer, motion allowed, loaded on idle) gets `resize()` first, since the new page has a new height,
 * then `scrollTo(..., { immediate, force })`; without it the window scrolls natively.
 */
export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const lastKey = useRef(location.key);
  const lastPath = useRef(location.pathname);
  const { lenis } = useLenis();
  const lenisRef = useRef(lenis);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    // Leaving the document (a link clicked before hydration, T-35, or an external link):
    // hand restoration back to the browser so "back" to it lands where the visitor was.
    const onPageHide = () => (window.history.scrollRestoration = 'auto');
    const onPageShow = () => (window.history.scrollRestoration = 'manual');
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  // Remember where each history entry was scrolled to.
  useEffect(() => {
    const save = () => positions.set(lastKey.current, window.scrollY);
    // A prerendered page (T-35) may have been scrolled before it hydrated.
    save();
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  // Before paint, so a clamped-scroll event from the shorter new page is not saved
  // against the previous entry.
  useLayoutEffect(() => {
    lastKey.current = location.key;
  }, [location.key]);

  // The first render is the page load, not a navigation: the browser owns the position.
  // Prerendered pages (T-35) can be scrolled before they hydrate; don't reset that.
  const isPageLoad = useRef(true);
  useEffect(() => {
    const pageLoad = isPageLoad.current;
    isPageLoad.current = false;
    const samePage = lastPath.current === location.pathname;
    lastPath.current = location.pathname;
    if (pageLoad && !location.hash) return;

    const to = (target: number | HTMLElement, smooth = false) => {
      const l = lenisRef.current;
      if (l) {
        l.resize();
        l.scrollTo(target, { immediate: !smooth, force: true });
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'instant' });
      } else {
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
      }
    };

    if (navType === NavigationType.Pop) {
      const y = positions.get(location.key) ?? 0;
      if (y === 0) {
        to(0);
        return;
      }
      return retryFor(3000, () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max >= y - 1) {
          to(y);
          return true;
        }
        return false;
      });
    }
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const smooth =
        samePage &&
        !pageLoad &&
        !!window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches;
      // A menu closing in this same commit restarts Lenis on its overflow `transitionend`, and that restart resets
      // any scroll already running: wait until Lenis runs again.
      return retryFor(3000, () => {
        const el = document.getElementById(id);
        if (!el || lenisRef.current?.isStopped) return false;
        to(el, smooth);
        return true;
      });
    }
    to(0);
  }, [location.key, location.hash, location.pathname, navType]);

  return null;
}
