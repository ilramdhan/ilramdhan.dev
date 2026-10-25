import {
  PostNavigation as ArticleNavigation,
  TagLinks as ArticleTagLinks,
} from '@/features/article/ArticleFooter';
import { BlogCard } from './BlogCard';
import type { AdjacentBlogs, BlogCard as BlogCardData } from './api';

/** Tag chips linking to the filtered blog list. */
export function TagLinks({ tags, className }: { tags: string[]; className?: string }) {
  return <ArticleTagLinks tags={tags} basePath="/blog" className={className} />;
}

/** Links to the previous (older) and next (newer) posts. */
export function PostNavigation({ adjacent }: { adjacent: AdjacentBlogs | undefined }) {
  return (
    <ArticleNavigation
      adjacent={adjacent}
      basePath="/blog"
      label="More posts"
      olderText="Older post"
      newerText="Newer post"
    />
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
