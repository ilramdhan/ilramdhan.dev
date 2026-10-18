import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { assertOk, unwrap, withoutId } from '@/lib/supabase/result';

export const SERVICE_COLUMNS = columns('services', 'id', 'title', 'description', 'icon_name');

export type Service = Pick<Tables<'services'>, 'id' | 'title' | 'description' | 'icon_name'>;
export type ServiceInsert = TablesInsert<'services'>;

export async function getServices(): Promise<Service[]> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase.from('services').select(SERVICE_COLUMNS).order('id', { ascending: true }),
  );
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
