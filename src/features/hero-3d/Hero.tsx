import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PillButton } from '@/components/tile/PillButton';
import { useMediaQuery } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { profileQueries } from '@/features/profile/queries';
import { useLocale, useLocalePath, useT } from '@/i18n';

// three.js, Rapier and the model live in this chunk. It is imported only when `useLanyard` allows it (D2), so phones,
// tablets, coarse pointers and reduced-motion visitors never download it.
const HeroCard = lazy(() => import('./HeroCard'));

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

/** Runs `fn` once the page has loaded and the main thread is idle; returns a cleanup. */
function afterLoadIdle(fn: () => void): () => void {
  let id = 0;
  let cancelled = false;
  const idle = () => {
    if (cancelled) return;
    id =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(fn, { timeout: 3000 })
        : window.setTimeout(fn, 300);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener('load', idle);
    if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id);
    window.clearTimeout(id);
  };
}

/**
 * Whether to mount the 3D card: LANYARD_QUERY matches (re-evaluated when it changes, e.g. a window resized below
 * 1024px unmounts it) and WebGL exists. The chunk is requested only after `load` + idle, so its parse, Rapier's WASM
 * start-up and the scene build never compete with hydration (the home long-task gate).
 */
function useLanyard(): boolean {
  const fits = useMediaQuery(LANYARD_QUERY);
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!fits || idle || !hasWebGL()) return;
    return afterLoadIdle(() => setIdle(true));
  }, [fits, idle]);
  return fits && idle;
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
 * Home hero (mutugading HomeHero, P15a): the owner's name as the h1, one lead line, a pill to the contact tile and a
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
      className="relative isolate -mt-(--nav-h) flex min-h-svh w-full flex-col bg-white text-ink"
    >
      {lanyard ? (
        <Suspense fallback={null}>
          <HeroCard />
        </Suspense>
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
              <PillButton href={lp('/#contact')}>{t.hero.contactMe}</PillButton>
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
