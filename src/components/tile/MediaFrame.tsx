import { InsetReveal } from '@/components/motion/InsetReveal';
import { Morph } from '@/components/motion/Morph';
import { ParallaxLayer } from '@/components/motion/ParallaxLayer';
import { SoftLight } from '@/components/motion/SoftLight';
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
   * hovered and a soft pointer light follows a fine pointer. Default false: a plain photo never reacts to the
   * pointer. Dropped when `parallax` or `settle` is set (never zoom and parallax on one photo).
   */
  interactive?: boolean;
  /** Scroll parallax travel in yPercent (5–8 for large standalone photos; engine lazy-loaded near the viewport). */
  parallax?: number;
  /** Inset clip reveal once in view, only when the frame starts below the fold (1–2 per page). */
  reveal?: boolean;
  /** Home hero scroll settle (1.06 → 1, square → 18px corners over the first 65svh; CSS scroll timeline). Home only. */
  settle?: boolean;
  /** View-transition name for a shared-element morph across routes (`morphName()`); one frame per name per page. */
  morph?: string;
  className?: string;
};

/**
 * Rounded (18px) photograph on the tile's frame grey (mutugading `media-frame.tsx`). The frame owns the box (aspect
 * class), so nothing shifts while the photo loads. Motion: `interactive` (inside a link) = 1.02 zoom on the link's
 * `.group` hover + soft light; `parallax`, `reveal`, `settle`, `morph` as documented on the props. Reduced motion: a
 * still photo. A priority (LCP) photo never starts hidden: its entrance (`animate-rise-still`) only translates.
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
  const img = src ? (
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
  ) : null;
  const light = hover ? <SoftLight tone="photo" /> : null;
  let layer = img && parallax ? <ParallaxLayer amount={parallax}>{img}</ParallaxLayer> : img;
  if (img && settle) {
    // Clip layer (animated corner radius) > zoom layer (animated scale) > image.
    layer = (
      <div data-settle="" className="absolute inset-0 overflow-hidden">
        <div data-settle-zoom="" className="absolute inset-0">
          {layer}
        </div>
      </div>
    );
  }
  const frame = (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-tile-frame',
        aspectClass[aspect],
        className,
      )}
      role={src ? undefined : alt ? 'img' : undefined}
      aria-label={src ? undefined : alt || undefined}
      data-media-interactive={hover ? '' : undefined}
      data-inset={inset ? '' : undefined}
      data-settle-frame={settle && src ? '' : undefined}
    >
      {layer}
      {light}
      {inset ? <InsetReveal /> : null}
    </div>
  );
  // The view-transition name sits on the frame only: the photo morphs, never text.
  return morph ? <Morph name={morph}>{frame}</Morph> : frame;
}
