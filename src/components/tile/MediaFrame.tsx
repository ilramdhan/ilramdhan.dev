import { Img } from '@/components/ui/Img';
import { cn } from '@/lib/utils';

export type MediaAspect =
  'wide' | 'video' | 'portrait' | 'landscape' | 'cinema' | 'square' | 'fill';

// Phones get a taller crop so the subject stays large (Apple art-directs per breakpoint).
const aspectClass: Record<MediaAspect, string> = {
  wide: 'aspect-[4/5] sm:aspect-[16/7]',
  video: 'aspect-[4/5] sm:aspect-video',
  portrait: 'aspect-[4/5]',
  landscape: 'aspect-[4/3]',
  cinema: 'aspect-[4/3] nav:aspect-[21/9]',
  square: 'aspect-square',
  fill: 'min-h-[min(340px,40svh)] flex-1 sm:min-h-[min(300px,30svh)]',
};

export type MediaFrameProps = {
  /** null renders a quiet neutral surface of the same size (no drawing, no label). */
  src: string | null;
  alt: string;
  /** Intrinsic size of the photo (Img keeps width/height so the browser knows the ratio before it loads). */
  width: number;
  height: number;
  aspect?: MediaAspect;
  /** The LCP photo: eager + high fetch priority. */
  priority?: boolean;
  /** object-position, e.g. "50% 60%". */
  position?: string;
  /**
   * Clickable photos only (the frame sits inside a link/button with `group`): the photo zooms 1.02 when the link is
   * hovered. Default false: a plain photo never reacts to the pointer. Dropped when `parallax` or `settle` is set.
   * The soft pointer light joins in R3.
   */
  interactive?: boolean;
  /** Scroll parallax travel in yPercent. Static phase: `data-parallax` hook only (engine in R3). */
  parallax?: number;
  /** Inset clip reveal once in view (1–2 per page). Static phase: `data-reveal-frame` hook only (R3). */
  reveal?: boolean;
  /** Home hero scroll settle (1.06 → 1, square → 18px). Static phase: `data-settle-frame` hook only (R3). */
  settle?: boolean;
  /** View-transition name for a shared-element morph across routes (R3). */
  morph?: string;
  className?: string;
};

/**
 * Rounded (18px) photograph on the tile's frame grey. The frame owns the box (aspect class), so nothing shifts while
 * the photo loads. Motion props are typed now and wired by the motion layer (R3); here they only set data hooks.
 */
export function MediaFrame({
  src,
  alt,
  width,
  height,
  aspect = 'video',
  priority,
  position,
  interactive = false,
  parallax,
  reveal,
  settle,
  morph,
  className,
}: MediaFrameProps) {
  // Never both on one photo: a scroll-moving layer plus a hover scale reads as wobble.
  const hover = interactive && !parallax && !settle && !!src;
  const inset = !!reveal && !parallax && !settle && !!src;
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-tile-frame',
        aspectClass[aspect],
        className,
      )}
      role={src ? undefined : alt ? 'img' : undefined}
      aria-label={src ? undefined : alt || undefined}
      data-media-interactive={hover ? '' : undefined}
      data-parallax={src && parallax ? parallax : undefined}
      data-inset={inset ? '' : undefined}
      data-settle-frame={settle && src ? '' : undefined}
      style={morph ? { viewTransitionName: morph } : undefined}
    >
      {src ? (
        <Img
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            hover &&
              'transition-transform duration-[800ms] ease-apple group-hover:scale-[1.02] motion-reduce:transition-none',
          )}
          style={position ? { objectPosition: position } : undefined}
        />
      ) : null}
    </div>
  );
}
