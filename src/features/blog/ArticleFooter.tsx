import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BlogCard } from './BlogCard';
import type { AdjacentBlogs, BlogCard as BlogCardData } from './api';

/** Tag chips linking to the filtered blog list. */
export function TagLinks({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            to={`/blog?tag=${encodeURIComponent(tag)}`}
            className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AdjacentLink({ post, newer }: { post: BlogCardData; newer: boolean }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      rel={newer ? 'next' : 'prev'}
      className={cn(
        'group flex h-full flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-500/50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/10 dark:bg-slate-900',
        newer && 'items-end text-right',
      )}
    >
      <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
        {!newer && <span aria-hidden="true">&larr;</span>}
        {newer ? 'Newer post' : 'Older post'}
        {newer && <span aria-hidden="true">&rarr;</span>}
      </span>
      <span className="font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 line-clamp-2">
        {post.title}
      </span>
    </Link>
  );
}

/** Links to the previous (older) and next (newer) posts. */
export function PostNavigation({ adjacent }: { adjacent: AdjacentBlogs | undefined }) {
  const { older, newer } = adjacent ?? { older: null, newer: null };
  if (!older?.slug && !newer?.slug) return null;
  return (
    <nav aria-label="More posts" className="grid gap-4 md:grid-cols-2">
      <div>{older?.slug && <AdjacentLink post={older} newer={false} />}</div>
      <div>{newer?.slug && <AdjacentLink post={newer} newer />}</div>
    </nav>
  );
}

/** "Related articles": up to three cards. */
export function RelatedPosts({ posts }: { posts: BlogCardData[] | undefined }) {
  if (!posts?.length) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        Related articles
      </h2>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <BlogCard post={post} headingLevel="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
