import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
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
  tag?: string | null;
}

export async function getProjects({ page, limit, tag }: ProjectListParams) {
  let query = supabase
    .from('projects')
    .select(PROJECT_CARD_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false });
  if (tag) query = query.contains('tags', [tag]);
  return unwrapPage<ProjectCard>(await query.range(...pageRange(page, limit)));
}

export async function getFeaturedProjects(): Promise<ProjectCard[]> {
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
  return unwrap(
    await supabase.from('projects').select(PROJECT_DETAIL_COLUMNS).eq('slug', slug).single(),
  );
}

export function getProjectTags(): Promise<string[]> {
  return fetchDistinct('project_tags', async () => {
    const rows = unwrap(await supabase.from('projects').select('tags'));
    return distinctSorted(rows.flatMap((p) => p.tags ?? []));
  });
}

/** Admin: up to 100 projects, newest first. */
export async function getAdminProjects(): Promise<Project[]> {
  return unwrap(
    await supabase
      .from('projects')
      .select(PROJECT_ADMIN_COLUMNS)
      .order('created_at', { ascending: false })
      .range(0, 99),
  );
}

export async function addProject(project: ProjectInsert): Promise<Project> {
  return unwrap(
    await supabase.from('projects').insert(project).select(PROJECT_ADMIN_COLUMNS).single(),
  );
}

export async function updateProject(
  updates: TablesUpdate<'projects'> & { id: number },
): Promise<Project> {
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
  assertOk(await supabase.from('projects').delete().eq('id', id));
}
