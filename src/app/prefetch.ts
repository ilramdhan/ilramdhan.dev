/**
 * Route-chunk prefetching (T-24). Links call `prefetchRoute(path)` on hover/focus; the
 * router registers the actual loader via `setRoutePrefetcher`, so components that render
 * links (Navbar, …) never import page modules themselves (that would be a cycle).
 */
let prefetcher: ((path: string) => void) | null = null;

export function setRoutePrefetcher(fn: (path: string) => void): void {
  prefetcher = fn;
}

export function prefetchRoute(path: string): void {
  prefetcher?.(path);
}
