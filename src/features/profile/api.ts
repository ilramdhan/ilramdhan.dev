import type { Tables, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { selectWithTranslations } from '@/lib/supabase/translations';
import { localize } from '@/i18n/localize';
import type { Locale } from '@/i18n/locale';
import { currentUserId, unwrap } from '@/lib/supabase/result';

/** Everything the public pages and the admin form read (all but `updated_at`). */
export const PROFILE_COLUMNS = columns(
  'profile',
  'id',
  'display_name',
  'badge_text',
  'hero_title',
  'short_description',
  'detailed_bio',
  'avatar_url',
  'resume_url',
  'address',
  'footer_text',
  'logo_text',
  'logo_url',
  'privacy_content',
  'terms_content',
  'social_links',
);

/** Public text of the profile that can be translated. */
export const PROFILE_TRANSLATED_FIELDS = [
  'badge_text',
  'hero_title',
  'short_description',
  'detailed_bio',
  'address',
  'footer_text',
  'privacy_content',
  'terms_content',
] as const;

export type Profile = Pick<
  Tables<'profile'>,
  | 'id'
  | 'display_name'
  | 'badge_text'
  | 'hero_title'
  | 'short_description'
  | 'detailed_bio'
  | 'avatar_url'
  | 'resume_url'
  | 'address'
  | 'footer_text'
  | 'logo_text'
  | 'logo_url'
  | 'privacy_content'
  | 'terms_content'
  | 'social_links'
> & { isTranslated?: boolean; translations?: Tables<'profile'>['translations'] };

export async function getProfile(locale: Locale = 'en'): Promise<Profile> {
  const supabase = await getSupabase();
  const result = await selectWithTranslations(locale !== 'en', PROFILE_COLUMNS, (cols) =>
    supabase
      .from('profile')
      .select(cols as typeof PROFILE_COLUMNS)
      .single(),
  );
  return localize(unwrap(result), locale, PROFILE_TRANSLATED_FIELDS);
}

/** Admin form: the English row with its raw `translations` (when the column exists). */
export async function getAdminProfile(): Promise<Profile> {
  const supabase = await getSupabase();
  const result = await selectWithTranslations(true, PROFILE_COLUMNS, (cols) =>
    supabase
      .from('profile')
      .select(cols as typeof PROFILE_COLUMNS)
      .single(),
  );
  return unwrap(result);
}

export async function updateProfile(updates: TablesUpdate<'profile'>): Promise<Profile> {
  const supabase = await getSupabase();
  const userId = await currentUserId();
  return unwrap(
    await supabase
      .from('profile')
      .update(updates)
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .single(),
  );
}
