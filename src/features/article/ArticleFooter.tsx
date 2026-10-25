import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/** Tag chips linking to the list at `basePath`, filtered by that tag. */
export function TagLinks({
  tags,
  basePath,
  className,
}: {
  tags: string[];
  /** List route, e.g. `/blog`. */
  basePath: string;
  className?: string;
}) {
  if (!tags.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            to={`${basePath}?tag=${encodeURIComponent(tag)}`}
            className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Minimal shape of a neighbouring item (a blog card, a project card). */
export interface AdjacentItem {
  slug: string | null;
  title: string;
}

export interface Adjacent<T extends AdjacentItem = AdjacentItem> {
  older: T | null;
  newer: T | null;
}

interface PostNavigationProps {
  adjacent: Adjacent | undefined;
  /** Detail route prefix, e.g. `/blog`: links go to `${basePath}/${slug}`. */
  basePath: string;
  /** `aria-label` of the `<nav>`. */
  label: string;
  olderText: string;
  newerText: string;
}

function AdjacentLink({
  item,
  basePath,
  text,
  newer,
}: {
  item: AdjacentItem;
  basePath: string;
  text: string;
  newer: boolean;
}) {
  return (
    <Link
      to={`${basePath}/${item.slug}`}
      rel={newer ? 'next' : 'prev'}
      className={cn(
        'group flex h-full flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-500/50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/10 dark:bg-slate-900',
        newer && 'items-end text-right',
      )}
    >
      <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
        {!newer && <span aria-hidden="true">&larr;</span>}
        {text}
        {newer && <span aria-hidden="true">&rarr;</span>}
      </span>
      <span className="font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 line-clamp-2">
        {item.title}
      </span>
    </Link>
  );
}

/** Links to the previous (older) and next (newer) items. */
export function PostNavigation({
  adjacent,
  basePath,
  label,
  olderText,
  newerText,
}: PostNavigationProps) {
  const { older, newer } = adjacent ?? { older: null, newer: null };
  if (!older?.slug && !newer?.slug) return null;
  return (
    <nav aria-label={label} className="grid gap-4 md:grid-cols-2">
      <div>
        {older?.slug && (
          <AdjacentLink item={older} basePath={basePath} text={olderText} newer={false} />
        )}
      </div>
      <div>
        {newer?.slug && <AdjacentLink item={newer} basePath={basePath} text={newerText} newer />}
      </div>
    </nav>
  );
}
