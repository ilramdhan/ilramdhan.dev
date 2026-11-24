import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { InsetReveal } from '@/components/motion/InsetReveal';
import { Morph } from '@/components/motion/Morph';
import { Img } from '@/components/ui/Img';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { useSwipe } from './use-swipe';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Aspect classes of the frame; phones get the taller crop. */
  aspectRatio?: string;
  /** Above-the-fold hero image (detail pages): eager + high fetch priority. */
  priority?: boolean;
  /** `sizes` hint for the rendered width. */
  sizes?: string;
  /** View-transition name (`morphName`): the frame morphs from the list card's photo. */
  morph?: string;
  /** Inset clip reveal once in view; only takes effect when the frame starts below the fold. */
  reveal?: boolean;
}

const ARROW =
  'pointer-events-auto grid size-11 place-items-center rounded-full bg-white/80 text-ink backdrop-blur-md transition-[background-color,scale] duration-200 ease-apple hover:bg-white active:scale-[0.96] motion-reduce:transition-none';

/**
 * Screenshot carousel on a MediaFrame-style frame (18px corners, frame grey): arrows on the photo, dots below it.
 * The photo never zooms on hover (it is not a link). Arrow keys and swipe change the slide.
 */
export function ImageCarousel({
  images,
  alt,
  aspectRatio = 'aspect-[4/3] sm:aspect-video',
  priority = false,
  sizes,
  morph,
  reveal,
}: ImageCarouselProps) {
  const t = useT();
  const [currentIndex, setCurrentIndex] = useState(0);
  const count = images?.length ?? 0;
  const go = (delta: number) => setCurrentIndex((curr) => (curr + delta + count) % count);
  const swipe = useSwipe((direction) => {
    if (count > 1) go(direction);
  });

  if (count === 0) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  const frame = (
    <div
      {...swipe}
      style={{ touchAction: 'pan-y' }}
      data-inset={reveal ? '' : undefined}
      className={cn('relative w-full overflow-hidden rounded-lg bg-tile-frame', aspectRatio)}
    >
      <Img
        key={currentIndex}
        src={images[currentIndex]!}
        alt={count > 1 ? t.gallery.imageOf(alt, currentIndex + 1, count) : alt}
        width={1600}
        height={900}
        priority={priority && currentIndex === 0}
        sizes={sizes}
        className="absolute inset-0 h-full w-full object-cover motion-safe:animate-page-in"
      />
      {count > 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.gallery.prev}
            className={ARROW}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label={t.gallery.next} className={ARROW}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
      {reveal ? <InsetReveal /> : null}
    </div>
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- carousel region is keyboard operable (arrow keys)
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={alt}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={onKeyDown}
      className="w-full"
    >
      {morph ? <Morph name={morph}>{frame}</Morph> : frame}
      {count > 1 && (
        <div className="mt-1 flex justify-center">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={t.gallery.showImage(idx + 1, count)}
              aria-current={idx === currentIndex}
              onClick={() => setCurrentIndex(idx)}
              className="group/dot grid size-11 place-items-center"
            >
              <span
                className={cn(
                  'size-2 rounded-full transition-colors duration-200 motion-reduce:transition-none',
                  idx === currentIndex ? 'bg-ink' : 'bg-ink-muted/40 group-hover/dot:bg-ink-muted',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
