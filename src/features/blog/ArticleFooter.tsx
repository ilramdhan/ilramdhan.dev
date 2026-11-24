import {
  PostNavigation as ArticleNavigation,
  TagLinks as ArticleTagLinks,
} from '@/features/article/ArticleFooter';
import { colVar } from '@/components/tile/stagger';
import { useT } from '@/i18n';
import { BlogCard } from './BlogCard';
import type { AdjacentBlogs, BlogCard as BlogCardData } from './api';

/** Tag links to the filtered blog list. */
export function TagLinks({ tags, className }: { tags: string[]; className?: string }) {
  return <ArticleTagLinks tags={tags} basePath="/blog" className={className} />;
}

/** Links to the previous (older) and next (newer) posts. */
export function PostNavigation({ adjacent }: { adjacent: AdjacentBlogs | undefined }) {
  const t = useT();
  return (
    <ArticleNavigation
      adjacent={adjacent}
      basePath="/blog"
      label={t.post.more}
      olderText={t.post.older}
      newerText={t.post.newer}
    />
  );
}

/** "Related articles": up to three linked groups. */
export function RelatedPosts({ posts }: { posts: BlogCardData[] | undefined }) {
  const t = useT();
  if (!posts?.length) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="text-section text-tile-ink">
        {t.post.related}
      </h2>
      <ul className="stagger-row mt-stack grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <li key={post.id} style={colVar(i, 3)}>
            <BlogCard post={post} headingLevel="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
