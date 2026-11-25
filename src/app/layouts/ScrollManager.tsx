import { useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';
import { useLenis } from '@/components/motion/SmoothScrollProvider';

const positions = new Map<string, number>();

/**
 * Retries `attempt` on animation frames until it returns true or `ms` elapsed (lazy chunks / data); `onTimeout` runs
 * when it never succeeded.
 */
function retryFor(ms: number, attempt: () => boolean, onTimeout?: () => void): () => void {
  let raf = 0;
  const end = performance.now() + ms;
  const tick = () => {
    if (attempt()) return;
    if (performance.now() > end) return onTimeout?.();
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
      const max = () => document.documentElement.scrollHeight - window.innerHeight;
      return retryFor(
        3000,
        () => {
          if (max() >= y - 1) {
            to(y);
            return true;
          }
          return false;
        },
        // The page came back shorter than when it was left (e.g. saved at the very bottom): go as far as it goes.
        () => to(Math.max(0, max())),
      );
    }
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const smooth =
        samePage &&
        !pageLoad &&
        !!window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches;
      // Self-correcting: a menu closing in this same commit restarts Lenis (which resets a running scroll), and Lenis
      // booting on idle can cut a native smooth scroll short. Wait until Lenis runs, scroll, then once the page has
      // settled check where the target landed and finish instantly if it is off.
      let started = false;
      let lastY = -1;
      let still = 0;
      return retryFor(4000, () => {
        const el = document.getElementById(id);
        if (!el || lenisRef.current?.isStopped) return false;
        if (!started) {
          started = true;
          to(el, smooth);
          return false;
        }
        const y = window.scrollY;
        still = y === lastY && !lenisRef.current?.isScrolling ? still + 1 : 0;
        lastY = y;
        if (still < 6) return false; // ~100ms without movement
        const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const top = el.getBoundingClientRect().top;
        const atEnd = y >= document.documentElement.scrollHeight - window.innerHeight - 1;
        if (Math.abs(top - pad) > 2 && !atEnd) to(el);
        return true;
      });
    }
    to(0);
  }, [location.key, location.hash, location.pathname, navType]);

  return null;
}
