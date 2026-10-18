import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
import { distinctSorted, fetchDistinct } from '@/lib/supabase/distinct';
import { assertOk, pageRange, unwrap, withoutId, unwrapPage } from '@/lib/supabase/result';
import { orIlikeFilter } from '@/lib/search';

type Row = Tables<'blogs'>;

/** Blog cards (lists, featured): never the markdown `content`. */
export const BLOG_CARD_COLUMNS = columns(
  'blogs',
  'id',
  'slug',
  'title',
  'excerpt',
  'images',
  'tags',
  'published_at',
);
export const BLOG_DETAIL_COLUMNS = columns(
  'blogs',
  'id',
  'slug',
  'title',
  'excerpt',
  'images',
  'tags',
  'published_at',
  'content',
);
/** Admin list + edit form: every column, so an edit round-trips the whole row. */
export const BLOG_ADMIN_COLUMNS = columns(
  'blogs',
  'id',
  'user_id',
  'slug',
  'title',
  'excerpt',
  'content',
  'images',
  'tags',
  'is_featured',
  'published_at',
  'created_at',
  'updated_at',
);
export const COMMENT_COLUMNS = columns('blog_comments', 'id', 'name', 'content', 'created_at');

export type BlogCard = Pick<
  Row,
  'id' | 'slug' | 'title' | 'excerpt' | 'images' | 'tags' | 'published_at'
>;
export type BlogDetail = BlogCard & Pick<Row, 'content'>;
export type Blog = Row;
export type BlogInsert = TablesInsert<'blogs'>;
export type Comment = Pick<Tables<'blog_comments'>, 'id' | 'name' | 'content' | 'created_at'>;

export interface BlogListParams {
  page: number;
  limit: number;
  query?: string;
  tag?: string | null;
  sort?: 'newest' | 'oldest';
}

export async function getBlogs({ page, limit, query: search, tag, sort }: BlogListParams) {
  let query = supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS, { count: 'exact' })
    .order('published_at', { ascending: sort === 'oldest' });
  const searchFilter = orIlikeFilter(['title', 'excerpt'], search);
  if (searchFilter) query = query.or(searchFilter);
  if (tag) query = query.contains('tags', [tag]);
  return unwrapPage<BlogCard>(await query.range(...pageRange(page, limit)));
}

/** Featured posts on the home carousel. */
export const FEATURED_LIMIT = 9;

export async function getFeaturedBlogs(): Promise<BlogCard[]> {
  return unwrap(
    await supabase
      .from('blogs')
      .select(BLOG_CARD_COLUMNS)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(FEATURED_LIMIT),
  );
}

export async function getBlogBySlug(slug: string): Promise<BlogDetail> {
  return unwrap(await supabase.from('blogs').select(BLOG_DETAIL_COLUMNS).eq('slug', slug).single());
}

export interface AdjacentBlogs {
  /** The next older post, if any. */
  older: BlogCard | null;
  /** The next newer post, if any. */
  newer: BlogCard | null;
}

/** The posts published right before and right after `publishedAt` (detail page footer). */
export async function getAdjacentBlogs(publishedAt: string): Promise<AdjacentBlogs> {
  const [older, newer] = await Promise.all([
    supabase
      .from('blogs')
      .select(BLOG_CARD_COLUMNS)
      .lt('published_at', publishedAt)
      .order('published_at', { ascending: false })
      .limit(1),
    supabase
      .from('blogs')
      .select(BLOG_CARD_COLUMNS)
      .gt('published_at', publishedAt)
      .order('published_at', { ascending: true })
      .limit(1),
  ]);
  return { older: unwrap(older)[0] ?? null, newer: unwrap(newer)[0] ?? null };
}

export const RELATED_LIMIT = 3;

/**
 * Up to three other posts sharing a tag with post `id`, newest first, topped up with the
 * latest posts when fewer share one.
 */
export async function getRelatedBlogs(id: number, tags: string[]): Promise<BlogCard[]> {
  const latest = () =>
    supabase
      .from('blogs')
      .select(BLOG_CARD_COLUMNS)
      .neq('id', id)
      .order('published_at', { ascending: false });
  const related = tags.length
    ? unwrap(await latest().overlaps('tags', tags).limit(RELATED_LIMIT))
    : [];
  if (related.length >= RELATED_LIMIT) return related;
  const seen = new Set(related.map((b) => b.id));
  const rest = unwrap(await latest().limit(RELATED_LIMIT * 2)).filter((b) => !seen.has(b.id));
  return [...related, ...rest].slice(0, RELATED_LIMIT);
}

export function getBlogTags(): Promise<string[]> {
  return fetchDistinct('blog_tags', async () => {
    const rows = unwrap(await supabase.from('blogs').select('tags'));
    return distinctSorted(rows.flatMap((b) => b.tags ?? []));
  });
}

/** Admin: up to 100 posts (drafts included for admins by RLS), newest first. */
export async function getAdminBlogs(): Promise<Blog[]> {
  return unwrap(
    await supabase
      .from('blogs')
      .select(BLOG_ADMIN_COLUMNS)
      .order('published_at', { ascending: false })
      .range(0, 99),
  );
}

export async function addBlog(blog: BlogInsert): Promise<Blog> {
  return unwrap(await supabase.from('blogs').insert(blog).select(BLOG_ADMIN_COLUMNS).single());
}

export async function updateBlog(updates: TablesUpdate<'blogs'> & { id: number }): Promise<Blog> {
  return unwrap(
    await supabase
      .from('blogs')
      .update(withoutId(updates))
      .eq('id', updates.id)
      .select(BLOG_ADMIN_COLUMNS)
      .single(),
  );
}

export async function deleteBlog(id: number): Promise<void> {
  assertOk(await supabase.from('blogs').delete().eq('id', id));
}

// --- Comments ---

export async function getComments(blogId: number): Promise<Comment[]> {
  return unwrap(
    await supabase
      .from('blog_comments')
      .select(COMMENT_COLUMNS)
      .eq('blog_id', blogId)
      .order('created_at', { ascending: true }),
  );
}

export async function addComment({
  postId,
  name,
  text,
}: {
  postId: number;
  name: string;
  text: string;
}): Promise<{ success: true }> {
  assertOk(await supabase.from('blog_comments').insert({ blog_id: postId, name, content: text }));
  return { success: true };
}
