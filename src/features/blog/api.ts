import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { distinctSorted, fetchDistinct } from '@/lib/supabase/distinct';
import { assertOk, pageRange, unwrap, withoutId, unwrapPage } from '@/lib/supabase/result';
import { orIlikeFilter } from '@/lib/search';
import { selectWithTranslations } from '@/lib/supabase/translations';
import { localize, localizeAll, type Localized } from '@/i18n/localize';
import type { Locale } from '@/i18n/locale';

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
/** Columns with a translation in `blogs.translations[locale]`. */
export const BLOG_TRANSLATED_FIELDS = ['title', 'excerpt', 'content'] as const;
export const COMMENT_COLUMNS = columns('blog_comments', 'id', 'name', 'content', 'created_at');

export type BlogCard = Localized<
  Pick<Row, 'id' | 'slug' | 'title' | 'excerpt' | 'images' | 'tags' | 'published_at'>
>;
export type BlogDetail = BlogCard & Pick<Row, 'content'>;
/** `translations` is absent until the T-41 migration is applied. */
export type Blog = Omit<Row, 'translations'> & { translations?: Row['translations'] };
export type BlogInsert = TablesInsert<'blogs'>;
export type Comment = Pick<Tables<'blog_comments'>, 'id' | 'name' | 'content' | 'created_at'>;

export interface BlogListParams {
  page: number;
  limit: number;
  query?: string;
  tag?: string | null;
  sort?: 'newest' | 'oldest';
}

const card = (rows: readonly object[], locale: Locale) =>
  localizeAll(rows, locale, BLOG_TRANSLATED_FIELDS) as BlogCard[];

// Search matches the English columns whatever the locale (ponytail: add a translated
// search when /id gets enough content to need it).
export async function getBlogs(
  { page, limit, query: search, tag, sort }: BlogListParams,
  locale: Locale = 'en',
) {
  const supabase = await getSupabase();
  const searchFilter = orIlikeFilter(['title', 'excerpt'], search);
  const result = await selectWithTranslations(locale !== 'en', BLOG_CARD_COLUMNS, (cols) => {
    let query = supabase
      .from('blogs')
      .select(cols as typeof BLOG_CARD_COLUMNS, { count: 'exact' })
      .order('published_at', { ascending: sort === 'oldest' });
    if (searchFilter) query = query.or(searchFilter);
    if (tag) query = query.contains('tags', [tag]);
    return query.range(...pageRange(page, limit));
  });
  const { data, count } = unwrapPage<object>(result);
  return { data: card(data, locale), count };
}

/** Featured posts on the home carousel. */
export const FEATURED_LIMIT = 9;

export async function getFeaturedBlogs(locale: Locale = 'en'): Promise<BlogCard[]> {
  const supabase = await getSupabase();
  const result = await selectWithTranslations(locale !== 'en', BLOG_CARD_COLUMNS, (cols) =>
    supabase
      .from('blogs')
      .select(cols as typeof BLOG_CARD_COLUMNS)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(FEATURED_LIMIT),
  );
  return card(unwrap(result), locale);
}

export async function getBlogBySlug(slug: string, locale: Locale = 'en'): Promise<BlogDetail> {
  const supabase = await getSupabase();
  const result = await selectWithTranslations(locale !== 'en', BLOG_DETAIL_COLUMNS, (cols) =>
    supabase
      .from('blogs')
      .select(cols as typeof BLOG_DETAIL_COLUMNS)
      .eq('slug', slug)
      .single(),
  );
  return localize(unwrap(result), locale, BLOG_TRANSLATED_FIELDS);
}

export interface AdjacentBlogs {
  /** The next older post, if any. */
  older: BlogCard | null;
  /** The next newer post, if any. */
  newer: BlogCard | null;
}

/**
 * The posts right before and right after post `id` (detail page footer), in a total
 * order of (published_at, id): posts sharing the timestamp are neighbours by id first, so
 * none is skipped when `published_at` ties.
 */
export async function getAdjacentBlogs(
  id: number,
  publishedAt: string,
  locale: Locale = 'en',
): Promise<AdjacentBlogs> {
  const supabase = await getSupabase();
  const cards = (cols: string) => supabase.from('blogs').select(cols as typeof BLOG_CARD_COLUMNS);
  const ask = (build: (select: typeof cards, cols: string) => PromiseLike<unknown>) =>
    selectWithTranslations(
      locale !== 'en',
      BLOG_CARD_COLUMNS,
      (cols) => build(cards, cols) as PromiseLike<{ error: unknown; data: object[] | null }>,
    );
  const [olderPeer, older, newerPeer, newer] = await Promise.all([
    ask((c, cols) =>
      c(cols)
        .eq('published_at', publishedAt)
        .lt('id', id)
        .order('id', { ascending: false })
        .limit(1),
    ),
    ask((c, cols) =>
      c(cols)
        .lt('published_at', publishedAt)
        .order('published_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(1),
    ),
    ask((c, cols) =>
      c(cols)
        .eq('published_at', publishedAt)
        .gt('id', id)
        .order('id', { ascending: true })
        .limit(1),
    ),
    ask((c, cols) =>
      c(cols)
        .gt('published_at', publishedAt)
        .order('published_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(1),
    ),
  ]);
  const first = (r: { error: unknown; data: object[] | null }) => card(unwrap(r) ?? [], locale)[0];
  return {
    older: first(olderPeer) ?? first(older) ?? null,
    newer: first(newerPeer) ?? first(newer) ?? null,
  };
}

export const RELATED_LIMIT = 3;

/**
 * Up to three other posts sharing a tag with post `id`, newest first, topped up with the
 * latest posts when fewer share one.
 */
export async function getRelatedBlogs(
  id: number,
  tags: string[],
  locale: Locale = 'en',
): Promise<BlogCard[]> {
  const supabase = await getSupabase();
  const latest = (cols: string) =>
    supabase
      .from('blogs')
      .select(cols as typeof BLOG_CARD_COLUMNS)
      .neq('id', id)
      .order('published_at', { ascending: false });
  const ask = async (limit: number, overlap: string[] | null) =>
    card(
      unwrap(
        await selectWithTranslations(locale !== 'en', BLOG_CARD_COLUMNS, (cols) =>
          overlap ? latest(cols).overlaps('tags', overlap).limit(limit) : latest(cols).limit(limit),
        ),
      ),
      locale,
    );
  const related = tags.length ? await ask(RELATED_LIMIT, tags) : [];
  if (related.length >= RELATED_LIMIT) return related;
  const seen = new Set(related.map((b) => b.id));
  const rest = (await ask(RELATED_LIMIT * 2, null)).filter((b) => !seen.has(b.id));
  return [...related, ...rest].slice(0, RELATED_LIMIT);
}

export function getBlogTags(): Promise<string[]> {
  return fetchDistinct('blog_tags', async () => {
    const supabase = await getSupabase();
    const rows = unwrap(await supabase.from('blogs').select('tags'));
    return distinctSorted(rows.flatMap((b) => b.tags ?? []));
  });
}

/** Admin: up to 100 posts (drafts included for admins by RLS), newest first. */
export async function getAdminBlogs(): Promise<Blog[]> {
  const supabase = await getSupabase();
  // The admin form edits `translations`; asked for only if the column exists yet.
  const result = await selectWithTranslations(true, BLOG_ADMIN_COLUMNS, (cols) =>
    supabase
      .from('blogs')
      .select(cols as typeof BLOG_ADMIN_COLUMNS)
      .order('published_at', { ascending: false })
      .range(0, 99),
  );
  return unwrap(result);
}

export async function addBlog(blog: BlogInsert): Promise<Blog> {
  const supabase = await getSupabase();
  return unwrap(await supabase.from('blogs').insert(blog).select(BLOG_ADMIN_COLUMNS).single());
}

export async function updateBlog(updates: TablesUpdate<'blogs'> & { id: number }): Promise<Blog> {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  assertOk(await supabase.from('blogs').delete().eq('id', id));
}

// --- Comments ---

export async function getComments(blogId: number): Promise<Comment[]> {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  assertOk(await supabase.from('blog_comments').insert({ blog_id: postId, name, content: text }));
  return { success: true };
}
