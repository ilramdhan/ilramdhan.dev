import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PillButton } from '@/components/tile/PillButton';
import { useMediaQuery } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { profileQueries } from '@/features/profile/queries';
import { useLocale, useLocalePath, useT } from '@/i18n';

// three.js, Rapier and the model live in this chunk. It is imported only when `useLanyard` allows it (D2), so phones,
// tablets, coarse pointers and reduced-motion visitors never download it. One retry covers a transient network error.
const HeroCard = lazy(() => import('./HeroCard').catch(() => import('./HeroCard')));

/** D2: the live lanyard runs on a desktop layout with a fine pointer and motion allowed. Same query as the CSS below. */
export const LANYARD_QUERY =
  '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Runs `fn` once the main thread is idle; returns a cleanup. Called from an effect, so hydration has already
 * committed. Deliberately not gated on `window.load` (F-14): `load` waits for every subresource, and a slow one on
 * a cold cache (a third-party iframe such as the Vercel toolbar, a large image) held it back for many seconds or
 * forever, so the card was missing on first open and only showed after a reload.
 */
function whenIdle(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 300);
  return () => window.clearTimeout(id);
}

/**
 * Whether to mount the 3D card: LANYARD_QUERY matches (re-evaluated when it changes, e.g. a window resized below
 * 1024px unmounts it) and WebGL exists. The chunk is requested after hydration + idle, so its parse, Rapier's WASM
 * start-up and the scene build never compete with hydration (the home long-task gate).
 */
function useLanyard(): boolean {
  const fits = useMediaQuery(LANYARD_QUERY);
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!fits || idle || !hasWebGL()) return;
    return whenIdle(() => setIdle(true));
  }, [fits, idle]);
  return fits && idle;
}

/**
 * The card is decoration: if its chunk, model or texture fails to load, the hero simply has no card. Without this
 * boundary the error reached the route boundary and replaced the whole home page with "Something went wrong".
 */
class CardBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

// The split layout (copy left, card right) is pure CSS on LANYARD_QUERY, so the prerendered HTML already lays out like
// the hydrated page and nothing shifts when the card mounts. Literal strings so Tailwind finds them.
const SPLIT_COPY =
  '[@media(min-width:1024px)_and_(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:w-1/2 [@media(min-width:1024px)_and_(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:items-start [@media(min-width:1024px)_and_(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:text-left';
const SPLIT_ITEMS =
  '[@media(min-width:1024px)_and_(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:items-start';
const SPLIT_LINKS =
  '[@media(min-width:1024px)_and_(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:justify-start';

function Bar({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block rounded-sm bg-tile-frame align-middle motion-safe:animate-pulse',
        className,
      )}
    />
  );
}

/**
 * Home hero (mutugading HomeHero, P15a): the owner's name as the h1, one lead line, a pill to the contact page and a
 * chevron link to the projects, then `specs` (a SpecRow of real counts). Clean white ground. On a desktop with a fine
 * pointer and motion allowed the copy moves to the left half and the lanyard hangs on the right (canvas behind the
 * pointer-transparent copy layer, so the card can be dragged). Entrance: the h1 rises without fading (LCP), the rest
 * rises with a fade 120ms later.
 */
export function Hero({ specs }: { specs?: ReactNode }) {
  const t = useT();
  const lp = useLocalePath();
  const locale = useLocale();
  const lanyard = useLanyard();
  const { data: profile, isPending } = useQuery(profileQueries.detail(locale));

  return (
    <section
      aria-labelledby="home-hero-h"
      data-enter=""
      className="relative isolate -mt-(--nav-h) flex min-h-[min(74svh,48rem)] w-full flex-col bg-white text-ink"
    >
      {lanyard ? (
        <CardBoundary>
          <Suspense fallback={null}>
            <HeroCard />
          </Suspense>
        </CardBoundary>
      ) : null}
      <div className="wrap pointer-events-none relative z-10 flex flex-1 flex-col justify-center pt-[calc(var(--nav-h)+clamp(2rem,6svh,4rem))] pb-[clamp(1.5rem,4svh,3rem)]">
        <div
          className={cn('pointer-events-auto flex flex-col items-center text-center', SPLIT_COPY)}
        >
          {/* Static name: stable for crawlers, screen readers and tests. A bar holds its place while the profile loads. */}
          <h1
            id="home-hero-h"
            className="min-h-[1.05em] max-w-[14ch] animate-rise-still text-hero text-balance text-tile-ink"
          >
            {profile?.display_name ?? <Bar className="h-[0.9em] w-[8ch]" />}
          </h1>
          <div
            className={cn(
              'flex animate-rise flex-col items-center [animation-delay:120ms]',
              SPLIT_ITEMS,
            )}
          >
            <p className="mt-5 min-h-[1.33em] max-w-[34ch] text-lead text-balance text-tile-ink">
              {isPending ? (
                <Bar className="h-[1em] w-[24ch] max-w-full" />
              ) : (
                profile?.short_description
              )}
            </p>
            <div
              className={cn(
                'mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4',
                SPLIT_LINKS,
              )}
            >
              <PillButton href={lp('/contact')}>{t.hero.contactMe}</PillButton>
              <PillButton href={lp('/projects')} variant="secondary">
                {t.hero.viewProjects}
              </PillButton>
            </div>
          </div>
          {specs}
        </div>
      </div>
    </section>
  );
}
