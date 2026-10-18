import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { assertOk, unwrap, withoutId } from '@/lib/supabase/result';

export type ResumeType = 'experience' | 'education';

/** Everything the About page and the admin form read (all but bookkeeping columns). */
export const RESUME_COLUMNS = columns(
  'resume',
  'id',
  'type',
  'title',
  'institution',
  'period',
  'description',
  'gpa',
  'tags',
);

export type ResumeItem = Pick<
  Tables<'resume'>,
  'id' | 'type' | 'title' | 'institution' | 'period' | 'description' | 'gpa' | 'tags'
>;
export type ResumeInsert = TablesInsert<'resume'>;

export async function getResume(type: ResumeType): Promise<ResumeItem[]> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase
      .from('resume')
      .select(RESUME_COLUMNS)
      .eq('type', type)
      .order('id', { ascending: true }),
  );
}

export async function addResumeItem(item: ResumeInsert): Promise<ResumeItem> {
  const supabase = await getSupabase();
  return unwrap(await supabase.from('resume').insert(item).select(RESUME_COLUMNS).single());
}

export async function updateResumeItem(
  updates: TablesUpdate<'resume'> & { id: number },
): Promise<ResumeItem> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase
      .from('resume')
      .update(withoutId(updates))
      .eq('id', updates.id)
      .select(RESUME_COLUMNS)
      .single(),
  );
}

export async function deleteResumeItem(id: number): Promise<void> {
  const supabase = await getSupabase();
  assertOk(await supabase.from('resume').delete().eq('id', id));
}
