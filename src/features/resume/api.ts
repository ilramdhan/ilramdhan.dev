import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
import { assertOk, currentUserId, unwrap } from '@/lib/supabase/result';

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
  return unwrap(
    await supabase
      .from('resume')
      .select(RESUME_COLUMNS)
      .eq('type', type)
      .order('id', { ascending: true }),
  );
}

export async function addResumeItem(item: Omit<ResumeInsert, 'user_id'>): Promise<ResumeItem> {
  const userId = await currentUserId();
  return unwrap(
    await supabase
      .from('resume')
      .insert({ ...item, user_id: userId })
      .select(RESUME_COLUMNS)
      .single(),
  );
}

export async function updateResumeItem(
  updates: TablesUpdate<'resume'> & { id: number },
): Promise<ResumeItem> {
  return unwrap(
    await supabase
      .from('resume')
      .update(updates)
      .eq('id', updates.id)
      .select(RESUME_COLUMNS)
      .single(),
  );
}

export async function deleteResumeItem(id: number): Promise<void> {
  assertOk(await supabase.from('resume').delete().eq('id', id));
}
