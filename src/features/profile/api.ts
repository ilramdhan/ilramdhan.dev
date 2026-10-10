import type { Tables, TablesUpdate } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
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
>;

export async function getProfile(): Promise<Profile> {
  return unwrap(await supabase.from('profile').select(PROFILE_COLUMNS).single());
}

export async function updateProfile(updates: TablesUpdate<'profile'>): Promise<Profile> {
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
