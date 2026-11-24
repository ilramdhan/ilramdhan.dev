import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { selectWithTranslations } from '@/lib/supabase/translations';
import { localizeAll, type Localized } from '@/i18n/localize';
import type { Locale } from '@/i18n/locale';
import { assertOk, unwrap, withoutId } from '@/lib/supabase/result';

export const SERVICE_COLUMNS = columns('services', 'id', 'title', 'description', 'icon_name');

export const SERVICE_TRANSLATED_FIELDS = ['title', 'description'] as const;

export type Service = Localized<
  Pick<Tables<'services'>, 'id' | 'title' | 'description' | 'icon_name'>
> & { translations?: Tables<'services'>['translations'] };
export type ServiceInsert = TablesInsert<'services'>;

async function fetchServices(withTranslations: boolean) {
  const supabase = await getSupabase();
  return unwrap(
    await selectWithTranslations(withTranslations, SERVICE_COLUMNS, (cols) =>
      supabase
        .from('services')
        .select(cols as typeof SERVICE_COLUMNS)
        .order('id', { ascending: true }),
    ),
  );
}

export async function getServices(locale: Locale = 'en'): Promise<Service[]> {
  return localizeAll(await fetchServices(locale !== 'en'), locale, SERVICE_TRANSLATED_FIELDS);
}

/** Admin list: English rows with their raw `translations` (when the column exists). */
export async function getAdminServices(): Promise<Service[]> {
  return await fetchServices(true);
}

export async function addService(service: ServiceInsert): Promise<Service> {
  const supabase = await getSupabase();
  return unwrap(await supabase.from('services').insert(service).select(SERVICE_COLUMNS).single());
}

export async function updateService(
  updates: TablesUpdate<'services'> & { id: number },
): Promise<Service> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase
      .from('services')
      .update(withoutId(updates))
      .eq('id', updates.id)
      .select(SERVICE_COLUMNS)
      .single(),
  );
}

export async function deleteService(id: number): Promise<void> {
  const supabase = await getSupabase();
  assertOk(await supabase.from('services').delete().eq('id', id));
}
