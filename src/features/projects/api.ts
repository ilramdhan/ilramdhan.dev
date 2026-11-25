import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { orIlikeFilter } from '@/lib/search';
import { distinctSorted, fetchDistinct } from '@/lib/supabase/distinct';
import { selectWithTranslations } from '@/lib/supabase/translations';
import { localize, localizeAll, type Localized } from '@/i18n/localize';
import type { Locale } from '@/i18n/locale';
import { assertOk, pageRange, unwrap, withoutId, unwrapPage } from '@/lib/supabase/result';

type Row = Tables<'projects'>;

/** Project cards (lists, featured): never the markdown `content`. */
export const PROJECT_CARD_COLUMNS = columns(
  'projects',
  'id',
  'slug',
  'title',
  'short_description',
  'images',
  'tech_stack',
  'demo_url',
  'repo_url',
);
export const PROJECT_DETAIL_COLUMNS = columns(
  'projects',
  'id',
  'slug',
  'title',
  'short_description',
  'images',
  'tech_stack',
  'demo_url',
  'repo_url',
  'content',
  'tags',
  'is_featured',
  'created_at',
);
/** Fields with a translation in `projects.translations[locale]`. */
export const PROJECT_TRANSLATED_FIELDS = ['title', 'short_description', 'content'] as const;
/** Admin list + edit form: every column, so an edit round-trips the whole row. */
export const PROJECT_ADMIN_COLUMNS = columns(
  'projects',
  'id',
  'user_id',
  'slug',
  'title',
  'short_description',
  'content',
  'images',
  'tech_stack',
  'tags',
  'demo_url',
  'repo_url',
  'is_featured',
  'created_at',
  'updated_at',
);

export type ProjectCard = Localized<
  Pick<
    Row,
    | 'id'
    | 'slug'
    | 'title'
    | 'short_description'
    | 'images'
    | 'tech_stack'
    | 'demo_url'
    | 'repo_url'
  >
>;
export type ProjectDetail = ProjectCard &
  Pick<Row, 'content' | 'tags' | 'is_featured' | 'created_at'>;
/** `translations` is absent until the T-41 migration is applied. */
export type Project = Omit<Row, 'translations'> & { translations?: Row['translations'] };
export type ProjectInsert = TablesInsert<'projects'>;

export interface ProjectListParams {
  page: number;
  limit: number;
  query?: string;
  tag?: string | null;
  sort?: 'newest' | 'oldest';
}

const card = (rows: readonly object[], locale: Locale) =>
  localizeAll(rows, locale, PROJECT_TRANSLATED_FIELDS) as ProjectCard[];
type Cols = typeof PROJECT_CARD_COLUMNS;

// Search matches the English columns whatever the locale (ponytail: add a translated
// search when /id gets enough content to need it).
export async function getProjects(
  { page, limit, query: search, tag, sort }: ProjectListParams,
  locale: Locale = 'en',
) {
  const supabase = await getSupabase();
  const searchFilter = orIlikeFilter(['title', 'short_description'], search);
  const result = await selectWithTranslations(locale !== 'en', PROJECT_CARD_COLUMNS, (cols) => {
    // `id` breaks ties so pages are stable. It stays ascending in both directions, which keeps
    // the default first page unchanged when rows share a `created_at` (as the e2e fixtures do).
    let query = supabase
      .from('projects')
      .select(cols as Cols, { count: 'exact' })
      .order('created_at', { ascending: sort === 'oldest' })
      .order('id', { ascending: true });
    if (searchFilter) query = query.or(searchFilter);
    if (tag) query = query.contains('tags', [tag]);
    return query.range(...pageRange(page, limit));
  });
  const { data, count } = unwrapPage<object>(result);
  return { data: card(data, locale), count };
}

/** Featured projects on the home carousel. */
export const FEATURED_PROJECTS_LIMIT = 4;

export async function getFeaturedProjects(locale: Locale = 'en'): Promise<ProjectCard[]> {
  const supabase = await getSupabase();
  const result = await selectWithTranslations(locale !== 'en', PROJECT_CARD_COLUMNS, (cols) =>
    supabase
      .from('projects')
      .select(cols as Cols)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .limit(FEATURED_PROJECTS_LIMIT),
  );
  return card(unwrap(result), locale);
}

export async function getProjectBySlug(
  slug: string,
  locale: Locale = 'en',
): Promise<ProjectDetail> {
  const supabase = await getSupabase();
  const result = await selectWithTranslations(locale !== 'en', PROJECT_DETAIL_COLUMNS, (cols) =>
    supabase
      .from('projects')
      .select(cols as typeof PROJECT_DETAIL_COLUMNS)
      .eq('slug', slug)
      .single(),
  );
  return localize(unwrap(result), locale, PROJECT_TRANSLATED_FIELDS);
}

export interface AdjacentProjects {
  /** The next older project (the one after it in the newest-first list), if any. */
  older: ProjectCard | null;
  /** The next newer project (the one before it in the newest-first list), if any. */
  newer: ProjectCard | null;
}

/**
 * The projects right before and right after project `id` (detail page footer), in the
 * `/projects` list order (`created_at desc, id asc`), so the footer agrees with the list.
 * In that order a same-timestamp peer with a *higher* id comes later, i.e. it is older;
 * this is the reverse of `getAdjacentBlogs`, whose posts never share a timestamp.
 */
export async function getAdjacentProjects(
  id: number,
  createdAt: string,
  locale: Locale = 'en',
): Promise<AdjacentProjects> {
  const supabase = await getSupabase();
  const select = (cols: string) => supabase.from('projects').select(cols as Cols);
  const ask = (build: (c: (cols: string) => ReturnType<typeof select>, cols: string) => unknown) =>
    selectWithTranslations(
      locale !== 'en',
      PROJECT_CARD_COLUMNS,
      (cols) => build(select, cols) as PromiseLike<{ error: unknown; data: object[] | null }>,
    );
  const [olderPeer, older, newerPeer, newer] = await Promise.all([
    ask((c, cols) =>
      c(cols).eq('created_at', createdAt).gt('id', id).order('id', { ascending: true }).limit(1),
    ),
    ask((c, cols) =>
      c(cols)
        .lt('created_at', createdAt)
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .limit(1),
    ),
    ask((c, cols) =>
      c(cols).eq('created_at', createdAt).lt('id', id).order('id', { ascending: false }).limit(1),
    ),
    ask((c, cols) =>
      c(cols)
        .gt('created_at', createdAt)
        .order('created_at', { ascending: true })
        .order('id', { ascending: false })
        .limit(1),
    ),
  ]);
  const first = (r: { error: unknown; data: object[] | null }) => card(unwrap(r) ?? [], locale)[0];
  return {
    older: first(olderPeer) ?? first(older) ?? null,
    newer: first(newerPeer) ?? first(newer) ?? null,
  };
}

/** How many related projects the detail page shows. */
export const RELATED_PROJECTS_LIMIT = 3;

/**
 * Up to three other projects sharing a tag with project `id`, newest first, topped up with
 * the latest projects when fewer share one (mirrors `getRelatedBlogs`).
 */
export async function getRelatedProjects(
  id: number,
  tags: string[],
  locale: Locale = 'en',
): Promise<ProjectCard[]> {
  const supabase = await getSupabase();
  const latest = (cols: string) =>
    supabase
      .from('projects')
      .select(cols as Cols)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
  const ask = async (limit: number, overlap: string[] | null) =>
    card(
      unwrap(
        await selectWithTranslations(locale !== 'en', PROJECT_CARD_COLUMNS, (cols) =>
          overlap ? latest(cols).overlaps('tags', overlap).limit(limit) : latest(cols).limit(limit),
        ),
      ),
      locale,
    );
  const related = tags.length ? await ask(RELATED_PROJECTS_LIMIT, tags) : [];
  if (related.length >= RELATED_PROJECTS_LIMIT) return related;
  const seen = new Set(related.map((p) => p.id));
  const rest = (await ask(RELATED_PROJECTS_LIMIT * 2, null)).filter((p) => !seen.has(p.id));
  return [...related, ...rest].slice(0, RELATED_PROJECTS_LIMIT);
}

export function getProjectTags(): Promise<string[]> {
  return fetchDistinct('project_tags', async () => {
    const supabase = await getSupabase();
    const rows = unwrap(await supabase.from('projects').select('tags'));
    return distinctSorted(rows.flatMap((p) => p.tags ?? []));
  });
}

/** Admin: up to 100 projects, newest first. */
export async function getAdminProjects(): Promise<Project[]> {
  const supabase = await getSupabase();
  // The admin form edits `translations`; asked for only if the column exists yet.
  const result = await selectWithTranslations(true, PROJECT_ADMIN_COLUMNS, (cols) =>
    supabase
      .from('projects')
      .select(cols as typeof PROJECT_ADMIN_COLUMNS)
      .order('created_at', { ascending: false })
      .range(0, 99),
  );
  return unwrap(result);
}

export async function addProject(project: ProjectInsert): Promise<Project> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase.from('projects').insert(project).select(PROJECT_ADMIN_COLUMNS).single(),
  );
}

export async function updateProject(
  updates: TablesUpdate<'projects'> & { id: number },
): Promise<Project> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase
      .from('projects')
      .update(withoutId(updates))
      .eq('id', updates.id)
      .select(PROJECT_ADMIN_COLUMNS)
      .single(),
  );
}

export async function deleteProject(id: number): Promise<void> {
  const supabase = await getSupabase();
  assertOk(await supabase.from('projects').delete().eq('id', id));
}
