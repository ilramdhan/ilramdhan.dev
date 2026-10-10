import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Img } from '@/components/ui/Img';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  aspectRatio?: string; // e.g., 'aspect-video', 'aspect-square'
  /** Above-the-fold hero image (detail pages): eager + high fetch priority. */
  priority?: boolean;
  /** `sizes` hint for the rendered width. */
  sizes?: string;
}

export function ImageCarousel({
  images,
  alt,
  aspectRatio = 'aspect-video',
  priority = false,
  sizes,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div
        className={`w-full ${aspectRatio} bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500`}
      >
        No Image
      </div>
    );
  }

  const count = images.length;
  const go = (delta: number) => setCurrentIndex((curr) => (curr + delta + count) % count);
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    go(-1);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    go(1);
  };

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

  // Swipe: a mostly-horizontal drag past 40px changes the slide.
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || count < 2) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- carousel region is keyboard operable (arrow keys)
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={alt}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{ touchAction: 'pan-y' }}
      className={`w-full ${aspectRatio} relative overflow-hidden group bg-slate-100 dark:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500`}
    >
      <Img
        key={currentIndex}
        src={images[currentIndex]!}
        alt={count > 1 ? `${alt}: image ${currentIndex + 1} of ${count}` : alt}
        width={1600}
        height={900}
        priority={priority && currentIndex === 0}
        sizes={sizes}
        className="w-full h-full object-cover motion-safe:animate-page-in transition-transform duration-500 group-hover:scale-105"
      />

      {count > 1 && (
        <>
          {/* Visible on touch/coarse pointers and keyboard focus; hover-only elsewhere. */}
          <div className="absolute inset-0 z-10 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity pointer-events-none">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="pointer-events-auto p-1 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="pointer-events-auto p-1 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Show image ${idx + 1} of ${count}`}
                aria-current={idx === currentIndex}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
