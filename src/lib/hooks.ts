import { startTransition, useState, useEffect, type RefObject } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * True while the markup on screen is the prerendered page (T-35): on the server, and in
 * the browser from hydration until the first client-side navigation. React hydrates
 * Suspense boundaries in separate passes, so "an effect has run" doesn't mean the whole
 * page is hydrated; this flag is set and cleared explicitly by the entry and the router.
 */
let prerenderedView = typeof window === 'undefined';

/** The entry is about to hydrate prerendered HTML. */
export function beginHydration(): void {
  prerenderedView = true;
}

/** The visitor navigated: from now on everything renders on the client. */
export function endPrerenderedView(): void {
  prerenderedView = false;
}

/**
 * Whether this component is part of the prerendered HTML (rendered on the server or
 * while hydrating it). Entrance animations skip such content: it is already on screen,
 * hiding it to fade it back in would only delay it.
 */
export function useIsPrerendered(): boolean {
  const [prerendered] = useState(() => prerenderedView);
  return prerendered;
}

/**
 * `false` while React hydrates prerendered HTML (and during the prerender itself), `true`
 * afterwards and in plain client renders. Values that only the browser knows (stored
 * theme, media queries) must render their server value until this flips, or hydration
 * would not match the static HTML (T-35). The flip is a transition: an urgent update
 * reaching a Suspense boundary that is still hydrating would make React discard the
 * server HTML (error #421).
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => !prerenderedView);
  useEffect(() => {
    if (!hydrated) startTransition(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}

const matchesNow = (query: string) =>
  typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/**
 * Tracks a CSS media query. `false` while prerendering and hydrating (the real value
 * arrives as a transition, see `useHydrated`) and in tests without matchMedia.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => !prerenderedView && matchesNow(query));
  useEffect(() => {
    startTransition(() => setMatches(matchesNow(query)));
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** `prefers-reduced-motion: reduce`, hydration-safe (framer's hook reads it during render). */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** Whether the element is (partly) in the viewport; `true` where IntersectionObserver is missing. */
export function useInView(ref: RefObject<Element>, rootMargin = '0px'): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
