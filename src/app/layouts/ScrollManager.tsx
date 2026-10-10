import { useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';

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
 * Scroll behaviour on navigation (T-30), replacing the unconditional scroll-to-top:
 * - POP (back/forward): restore the position saved for that history entry once the
 *   page is tall enough (pages are lazy and data-driven).
 * - PUSH/REPLACE with a hash: scroll to the target as soon as it exists; sections
 *   carry `scroll-margin-top` so the fixed navbar never covers them.
 * - Otherwise: top of the page.
 */
export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const lastKey = useRef(location.key);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  // Remember where each history entry was scrolled to.
  useEffect(() => {
    const save = () => positions.set(lastKey.current, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  // Before paint, so a clamped-scroll event from the shorter new page is not saved
  // against the previous entry.
  useLayoutEffect(() => {
    lastKey.current = location.key;
  }, [location.key]);

  useEffect(() => {
    if (navType === NavigationType.Pop) {
      const y = positions.get(location.key) ?? 0;
      if (y === 0) {
        window.scrollTo(0, 0);
        return;
      }
      return retryFor(3000, () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max >= y - 1) {
          window.scrollTo({ top: y, behavior: 'instant' });
          return true;
        }
        return false;
      });
    }
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      return retryFor(3000, () => {
        const el = document.getElementById(id);
        if (!el) return false;
        el.scrollIntoView();
        return true;
      });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.key, location.hash, navType]);

  return null;
}
