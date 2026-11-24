import type Lenis from 'lenis';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useLocation } from 'react-router';
import { motionRegistry } from './motion-registry';
import { motionOk } from './near';

type LenisApi = {
  /** Live Lenis instance (null on touch / reduced motion / SSR / before the idle boot). */
  lenis: Lenis | null;
  /** Freeze page scroll (menus, sheets). Works with and without Lenis. */
  stop: () => void;
  start: () => void;
  /** Scroll velocity in px/frame, updated every tick without re-rendering. */
  velocity: RefObject<number>;
};

const LenisContext = createContext<LenisApi | null>(null);

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Lenis smooth scroll on gsap.ticker (mutugading `smooth-scroll-provider.tsx`: lerp 0.08, wheelMultiplier 0.9).
 * Native scroll on coarse pointers and under reduced motion. The engine (Lenis + GSAP) is imported once the browser
 * is idle after hydration, so it never competes with first paint; until then the page scrolls natively.
 * Scroll-to-top / restoration on navigation stays with ScrollManager; this only refreshes ScrollTrigger.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const velocity = useRef(0);
  const { pathname } = useLocation();

  useEffect(() => {
    // ponytail: reduced motion at load never downloads the engine (nothing would move); a later switch to
    // motion-ok takes effect on the next page load.
    if (!motionOk()) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const w = window as IdleWindow;
    const boot = () => {
      import('./lenis-engine')
        .then(({ startEngine }) => {
          if (!cancelled) cleanup = startEngine({ velocity, onLenis: setLenis });
        })
        .catch(() => {
          /* engine failed to load: native scroll keeps working */
        });
    };
    const idle = w.requestIdleCallback
      ? w.requestIdleCallback(boot, { timeout: 2500 })
      : window.setTimeout(boot, 1200);
    return () => {
      cancelled = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cleanup?.();
      setLenis(null);
    };
  }, []);

  // A new page has new trigger positions (and maybe a new height for Lenis).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const raf = requestAnimationFrame(() => {
      lenis?.resize();
      motionRegistry.scrollTrigger?.refresh();
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, lenis]);

  const api = useMemo<LenisApi>(
    () => ({
      lenis,
      velocity,
      stop: () => {
        lenis?.stop();
        document.documentElement.style.overflow = 'hidden';
      },
      start: () => {
        document.documentElement.style.overflow = '';
        lenis?.start();
      },
    }),
    [lenis],
  );

  return <LenisContext.Provider value={api}>{children}</LenisContext.Provider>;
}

const noop: Omit<LenisApi, 'velocity'> = {
  lenis: null,
  stop: () => {
    document.documentElement.style.overflow = 'hidden';
  },
  start: () => {
    document.documentElement.style.overflow = '';
  },
};

/** stop/start + live instance + velocity. Safe outside the provider (native fallbacks, velocity stays 0). */
// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs to its provider
export function useLenis(): LenisApi {
  const ctx = useContext(LenisContext);
  const own = useRef(0);
  return ctx ?? { ...noop, velocity: own };
}
