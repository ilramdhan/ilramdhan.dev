import { Link } from '@/i18n/Link';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

/** Tag links to the list at `basePath`, filtered by that tag: plain action-coloured text, no chips. */
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
  const t = useT();
  if (!tags.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-x-4', className)} aria-label={t.common.tags}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            to={`${basePath}?tag=${encodeURIComponent(tag)}`}
            className="inline-flex min-h-11 items-center text-caption text-tile-action underline-offset-4 hover:text-tile-action-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-action"
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
        'group flex h-full flex-col gap-1 border-t border-rule py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tile-action',
        newer && 'items-end text-right',
      )}
    >
      <span className="text-caption text-tile-muted">
        {!newer && <span aria-hidden="true">&larr; </span>}
        {text}
        {newer && <span aria-hidden="true"> &rarr;</span>}
      </span>
      <span className="line-clamp-2 text-title text-balance text-tile-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
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
    <nav aria-label={label} className="grid gap-x-8 md:grid-cols-2">
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
