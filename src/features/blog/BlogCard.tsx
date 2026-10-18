import { Link } from 'react-router-dom';
import { Calendar, FileText } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { BlogCard as BlogCardData } from './api';

const MAX_TAGS = 2;

interface BlogCardProps {
  post: BlogCardData;
  /** Large horizontal card (the newest post on /blog). */
  variant?: 'default' | 'feature';
  /** Heading level for the title: h2 on list pages, h3 inside a titled section. */
  headingLevel?: 'h2' | 'h3';
  /** `sizes` for the cover image; defaults to a 3-column grid. */
  sizes?: string;
  className?: string;
}

/**
 * Blog post card (list, home carousel, related posts): 16:9 cover or placeholder, date,
 * up to two tags (+N), clamped title and excerpt. The whole card is one link target.
 */
export function BlogCard({
  post,
  variant = 'default',
  headingLevel: Heading = 'h2',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  className,
}: BlogCardProps) {
  const feature = variant === 'feature';
  const tags = post.tags ?? [];
  const cover = post.images?.[0];

  return (
    <article
      className={cn(
        'group relative flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color,transform] hover:border-indigo-500/40 hover:shadow-lg motion-safe:hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-white/10 dark:bg-slate-900',
        feature ? 'flex-col md:flex-row' : 'flex-col',
        className,
      )}
    >
      <div
        className={cn(
          'relative aspect-video shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800',
          feature && 'md:aspect-auto md:w-3/5',
        )}
      >
        {cover ? (
          <Img
            src={cover}
            alt=""
            width={1600}
            height={900}
            sizes={feature ? '(min-width: 768px) 60vw, 100vw' : sizes}
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/15 via-slate-100 to-sky-500/15 text-indigo-400 dark:via-slate-900"
          >
            <FileText className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className={cn('flex flex-1 flex-col p-5', feature && 'md:p-8 md:justify-center')}>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
          </span>
          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
              {tags.slice(0, MAX_TAGS).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {tag}
                </li>
              ))}
              {tags.length > MAX_TAGS && (
                <li className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-white/5 dark:text-slate-400">
                  +{tags.length - MAX_TAGS}
                </li>
              )}
            </ul>
          )}
        </div>
        <Heading
          className={cn(
            'mb-2 font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 break-words',
            feature ? 'text-2xl md:text-3xl line-clamp-3' : 'text-lg line-clamp-2',
          )}
        >
          {post.slug ? (
            <Link
              to={`/blog/${post.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </Heading>
        {post.excerpt && (
          <p
            className={cn(
              'text-sm text-slate-600 dark:text-slate-400',
              feature ? 'md:text-base line-clamp-4' : 'line-clamp-3',
            )}
          >
            {post.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}

/** Placeholder with the same box as `BlogCard` while posts load. */
export function BlogCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'feature' }) {
  const feature = variant === 'feature';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900',
        feature ? 'flex-col md:flex-row' : 'flex-col',
      )}
    >
      <div
        className={cn(
          'aspect-video bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800',
          feature && 'md:aspect-auto md:min-h-72 md:w-3/5',
        )}
      />
      <div className="flex-1 space-y-3 p-5">
        <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-6 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-14 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}
