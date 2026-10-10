import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
import { distinctSorted, fetchDistinct } from '@/lib/supabase/distinct';
import { assertOk, pageRange, unwrap, withoutId, unwrapPage } from '@/lib/supabase/result';
import { ilikeContains } from '@/lib/search';

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
}

export async function getBlogs({ page, limit, query: search, tag }: BlogListParams) {
  let query = supabase
    .from('blogs')
    .select(BLOG_CARD_COLUMNS, { count: 'exact' })
    .order('published_at', { ascending: false });
  const titlePattern = ilikeContains(search);
  if (titlePattern) query = query.ilike('title', titlePattern);
  if (tag) query = query.contains('tags', [tag]);
  return unwrapPage<BlogCard>(await query.range(...pageRange(page, limit)));
}

export async function getFeaturedBlogs(): Promise<BlogCard[]> {
  return unwrap(
    await supabase
      .from('blogs')
      .select(BLOG_CARD_COLUMNS)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(2),
  );
}

export async function getBlogBySlug(slug: string): Promise<BlogDetail> {
  return unwrap(await supabase.from('blogs').select(BLOG_DETAIL_COLUMNS).eq('slug', slug).single());
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
