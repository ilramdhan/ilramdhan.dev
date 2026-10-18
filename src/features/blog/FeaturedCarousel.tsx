import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks';
import { BlogCard, BlogCardSkeleton } from './BlogCard';
import type { BlogCard as BlogCardData } from './api';

/** Up to this many posts are shown as a plain grid instead of a carousel. */
export const CAROUSEL_MIN_POSTS = 4;

const CARD_SIZES = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 85vw';
const GRID = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';
/** ~1.2 / 2 / 3 cards per view; the gap between cards is each slide's right padding. */
const SLIDE = 'w-4/5 shrink-0 snap-start pr-6 md:w-1/2 lg:w-1/3';
/** Inline (not a Tailwind arbitrary class): the shared CSS bundle is at its budget. */
const HIDE_SCROLLBAR = { scrollbarWidth: 'none' } as const;
/** One icon for both buttons (a second one would add a shared chunk to the entry's list). */
const MIRROR = { scale: '-1 1' } as const;
const NAV_BUTTON =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-indigo-500/50 hover:text-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-indigo-400';

/** Skeleton row with the carousel's / grid's card boxes. */
export function FeaturedCarouselSkeleton() {
  return (
    <div className={GRID}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={i === 1 ? 'hidden md:block' : i === 2 ? 'hidden lg:flex flex-col' : ''}
        >
          <BlogCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/**
 * Featured posts as a native CSS scroll-snap carousel (swipe / trackpad / keyboard focus
 * scrolls it natively; prev/next buttons from md up). Three posts or fewer are a grid.
 * The first render never measures anything, so it matches the prerendered HTML; the
 * buttons' disabled state is read from the track after mount.
 */
export function FeaturedCarousel({ posts }: { posts: BlogCardData[] }) {
  const track = useRef<HTMLUListElement>(null);
  const reducedMotion = useReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const start = el.scrollLeft <= 1;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  const isCarousel = posts.length >= CAROUSEL_MIN_POSTS;
  useEffect(() => {
    const el = track.current;
    if (!isCarousel || !el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [isCarousel, measure]);

  if (!isCarousel) {
    return (
      <ul className={GRID}>
        {posts.map((post) => (
          <li key={post.id}>
            <BlogCard post={post} headingLevel="h3" />
          </li>
        ))}
      </ul>
    );
  }

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    const step = slide?.offsetWidth ?? el.clientWidth;
    el.scrollBy({ left: direction * step, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Featured articles">
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          className={NAV_BUTTON}
          aria-label="Previous articles"
          disabled={edges.start}
          onClick={() => scroll(-1)}
        >
          <ChevronRight className="h-5 w-5" style={MIRROR} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={NAV_BUTTON}
          aria-label="Next articles"
          disabled={edges.end}
          onClick={() => scroll(1)}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <ul
        ref={track}
        data-testid="featured-track"
        className="flex snap-x snap-mandatory overflow-x-auto py-2"
        style={HIDE_SCROLLBAR}
      >
        {posts.map((post, i) => (
          <li
            key={post.id}
            className={SLIDE}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${posts.length}`}
          >
            <BlogCard post={post} headingLevel="h3" sizes={CARD_SIZES} />
          </li>
        ))}
      </ul>
    </div>
  );
}
