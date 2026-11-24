import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { selectWithTranslations } from '@/lib/supabase/translations';
import { localizeAll, type Localized } from '@/i18n/localize';
import type { Locale } from '@/i18n/locale';
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

export const RESUME_TRANSLATED_FIELDS = ['title', 'institution', 'period', 'description'] as const;

export type ResumeItem = Localized<
  Pick<
    Tables<'resume'>,
    'id' | 'type' | 'title' | 'institution' | 'period' | 'description' | 'gpa' | 'tags'
  >
> & { translations?: Tables<'resume'>['translations'] };
export type ResumeInsert = TablesInsert<'resume'>;

async function fetchResume(type: ResumeType, withTranslations: boolean) {
  const supabase = await getSupabase();
  return unwrap(
    await selectWithTranslations(withTranslations, RESUME_COLUMNS, (cols) =>
      supabase
        .from('resume')
        .select(cols as typeof RESUME_COLUMNS)
        .eq('type', type)
        .order('id', { ascending: true }),
    ),
  );
}

export async function getResume(type: ResumeType, locale: Locale = 'en'): Promise<ResumeItem[]> {
  return localizeAll(await fetchResume(type, locale !== 'en'), locale, RESUME_TRANSLATED_FIELDS);
}

/** Admin list: English rows with their raw `translations` (when the column exists). */
export async function getAdminResume(type: ResumeType): Promise<ResumeItem[]> {
  return await fetchResume(type, true);
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
