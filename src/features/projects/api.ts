import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { orIlikeFilter } from '@/lib/search';
import { distinctSorted, fetchDistinct } from '@/lib/supabase/distinct';
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

export type ProjectCard = Pick<
  Row,
  'id' | 'slug' | 'title' | 'short_description' | 'images' | 'tech_stack' | 'demo_url' | 'repo_url'
>;
export type ProjectDetail = ProjectCard &
  Pick<Row, 'content' | 'tags' | 'is_featured' | 'created_at'>;
export type Project = Row;
export type ProjectInsert = TablesInsert<'projects'>;

export interface ProjectListParams {
  page: number;
  limit: number;
  query?: string;
  tag?: string | null;
  sort?: 'newest' | 'oldest';
}

export async function getProjects({ page, limit, query: search, tag, sort }: ProjectListParams) {
  const supabase = await getSupabase();
  // `id` breaks ties so pages are stable. It stays ascending in both directions, which keeps
  // the default first page unchanged when rows share a `created_at` (as the e2e fixtures do).
  let query = supabase
    .from('projects')
    .select(PROJECT_CARD_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: sort === 'oldest' })
    .order('id', { ascending: true });
  const searchFilter = orIlikeFilter(['title', 'short_description'], search);
  if (searchFilter) query = query.or(searchFilter);
  if (tag) query = query.contains('tags', [tag]);
  return unwrapPage<ProjectCard>(await query.range(...pageRange(page, limit)));
}

export async function getFeaturedProjects(): Promise<ProjectCard[]> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase
      .from('projects')
      .select(PROJECT_CARD_COLUMNS)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(3),
  );
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase.from('projects').select(PROJECT_DETAIL_COLUMNS).eq('slug', slug).single(),
  );
}

/** How many related projects the detail page shows. */
export const RELATED_PROJECTS_LIMIT = 3;

/**
 * Up to three other projects sharing a tag with project `id`, newest first, topped up with
 * the latest projects when fewer share one (mirrors `getRelatedBlogs`).
 */
export async function getRelatedProjects(id: number, tags: string[]): Promise<ProjectCard[]> {
  const supabase = await getSupabase();
  const latest = () =>
    supabase
      .from('projects')
      .select(PROJECT_CARD_COLUMNS)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
  const related = tags.length
    ? unwrap(await latest().overlaps('tags', tags).limit(RELATED_PROJECTS_LIMIT))
    : [];
  if (related.length >= RELATED_PROJECTS_LIMIT) return related;
  const seen = new Set(related.map((p) => p.id));
  const rest = unwrap(await latest().limit(RELATED_PROJECTS_LIMIT * 2)).filter(
    (p) => !seen.has(p.id),
  );
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
  return unwrap(
    await supabase
      .from('projects')
      .select(PROJECT_ADMIN_COLUMNS)
      .order('created_at', { ascending: false })
      .range(0, 99),
  );
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
