import { colVar } from '@/components/tile/stagger';
import { BlogCard, BlogFeature } from './BlogCard';
import type { BlogCard as BlogCardData } from './api';

/**
 * The cards of /blog (featured split + article rows). Its own chunk (see pages/blog.tsx): the cover frames and
 * stagger pull in the tile/motion partials, which the first paint of /blog (hero, filters, skeleton) doesn't need.
 */
export function BlogFeatureSlot({ post }: { post: BlogCardData }) {
  return (
    <div className="mb-stack-lg w-full">
      <BlogFeature post={post} />
    </div>
  );
}

export default function BlogRows({ rows }: { rows: BlogCardData[] }) {
  return (
    <>
      {rows.map((blog, i) => (
        <li key={blog.id} data-flip-id={blog.id} style={colVar(i, 3)}>
          <BlogCard post={blog} />
        </li>
      ))}
    </>
  );
}
