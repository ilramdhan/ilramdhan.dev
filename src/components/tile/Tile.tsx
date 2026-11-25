import { lazy, Suspense, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TileBackdrop, type BackdropShape } from './TileBackdrop';

// Lazy: `glow` is rare (one quiet light per page at most), so pages without it don't ship the pointer code.
const SoftLight = lazy(() =>
  import('@/components/motion/SoftLight').then((m) => ({ default: m.SoftLight })),
);
const Glow = () => (
  <Suspense fallback={null}>
    <SoftLight tone="tile" className="-z-10" />
  </Suspense>
);

export type TileTone = 'white' | 'parchment' | 'dark';
export type TileAlign = 'center' | 'split';
export type TileSize = 'default' | 'hero' | 'roomy' | 'screen';
/** "single" = one rounded panel, "start"/"end" = the top / bottom half of one panel built from two tiles. */
export type TileInset = 'single' | 'start' | 'end';

const toneClass: Record<TileTone, string> = {
  white: 'bg-white text-ink',
  parchment: 'bg-parchment text-ink',
  dark: 'bg-night text-on-dark',
};

const sizeClass: Record<TileSize, string> = {
  default: 'py-section',
  // Exactly one viewport; it slides under the translucent nav (-mt) so the photo (MediaFrame aspect="fill") ends on the fold.
  hero: '-mt-(--nav-h) flex min-h-svh flex-col pt-[calc(var(--nav-h)+clamp(3rem,8svh,5.5rem))] pb-[clamp(1.5rem,5svh,3rem)]',
  roomy: 'py-[clamp(6rem,14vw,11rem)]',
  // At least one screen (content centred vertically), so the next tile never peeks in. Content-heavy tiles grow.
  screen: 'flex min-h-svh flex-col justify-center py-section',
};

const alignClass: Record<TileAlign, string> = {
  center: 'flex flex-col items-center text-center',
  split: 'grid items-center gap-y-stack gap-x-16 lg:grid-cols-2',
};

const insetRadius: Record<TileInset, string> = {
  single: 'rounded-[20px] nav:rounded-[32px]',
  start: 'rounded-t-[20px] nav:rounded-t-[32px]',
  end: 'rounded-b-[20px] nav:rounded-b-[32px]',
};

/**
 * Rounded panel floating on the page surface (apple.com tile style): side margins, 20px corners (32px from 834px),
 * the tile tone on the panel only. Two adjacent panels `start` + `end` read as one surface.
 */
export function InsetPanel({
  id,
  tone,
  inset,
  className,
  children,
}: {
  id?: string;
  tone: TileTone;
  inset: TileInset;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn(
        'w-full bg-white px-3 sm:px-6',
        inset === 'end' && '-mt-px',
        inset !== 'start' && 'pb-section',
      )}
    >
      <div
        data-tone={tone}
        className={cn(
          'mx-auto w-full max-w-[calc(var(--wrap)+var(--gutter)*2)]',
          toneClass[tone],
          insetRadius[inset],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export type TileProps = {
  /** Anchor id (scroll target). */
  id?: string;
  /** id of the heading that names this section (TileHeading `id`). */
  labelledBy: string;
  tone?: TileTone;
  align?: TileAlign;
  size?: TileSize;
  /**
   * Marks the hero whose content enters once on load (`data-enter`). The page puts `animate-rise` on the copy
   * (`[animation-delay:120ms]` after the heading) and `animate-rise-still` on the LCP photo and h1: translate only, so
   * the LCP element never starts at opacity 0. Reduced motion = still.
   */
  enter?: boolean;
  /**
   * Soft tile light: a very quiet tile-aware radial light following a fine pointer behind the content. Off for touch
   * and reduced motion.
   */
  glow?: boolean;
  /** Render as a rounded inset panel instead of a full-bleed tile (see InsetPanel). */
  inset?: TileInset;
  /** One quiet abstract shape in a corner (D7), parallaxed; max one per tile. */
  backdrop?: { shape: BackdropShape; side?: 'left' | 'right' };
  className?: string;
  /** Classes for the inner max-width wrap. */
  innerClassName?: string;
  children: ReactNode;
};

/**
 * Full-bleed Apple tile. Tiles stack with zero gap; the surface change is the divider (no borders, no shadows).
 * `tone="dark"` sets data-tone="dark", which re-points the --tile-* tokens so every partial inside adapts.
 */
export function Tile({
  id,
  labelledBy,
  tone = 'white',
  align = 'center',
  size = 'default',
  enter,
  glow,
  inset,
  backdrop,
  className,
  innerClassName,
  children,
}: TileProps) {
  const deco = backdrop ? <TileBackdrop {...backdrop} /> : null;
  if (inset) {
    return (
      <InsetPanel id={id} tone={tone} inset={inset}>
        <section
          aria-labelledby={labelledBy}
          data-glow={glow ? '' : undefined}
          className={cn(
            'w-full scroll-mt-(--nav-h) overflow-hidden',
            insetRadius[inset],
            (glow || backdrop) && 'relative isolate',
            sizeClass[size === 'screen' ? 'default' : size],
            className,
          )}
        >
          {glow ? <Glow /> : null}
          <div className={cn('wrap', alignClass[align], innerClassName)}>{children}</div>
          {deco}
        </section>
      </InsetPanel>
    );
  }
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-tone={tone}
      data-enter={enter ? '' : undefined}
      data-glow={glow ? '' : undefined}
      className={cn(
        'w-full scroll-mt-(--nav-h)',
        (glow || backdrop) && 'relative isolate',
        toneClass[tone],
        sizeClass[size],
        className,
      )}
    >
      {glow ? <Glow /> : null}
      <div className={cn('wrap', alignClass[align], size === 'hero' && 'flex-1', innerClassName)}>
        {children}
      </div>
      {deco}
    </section>
  );
}
