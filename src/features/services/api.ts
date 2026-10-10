import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
import { assertOk, currentUserId, unwrap, withoutId } from '@/lib/supabase/result';

export const SERVICE_COLUMNS = columns('services', 'id', 'title', 'description', 'icon_name');

export type Service = Pick<Tables<'services'>, 'id' | 'title' | 'description' | 'icon_name'>;
export type ServiceInsert = TablesInsert<'services'>;

export async function getServices(): Promise<Service[]> {
  return unwrap(
    await supabase.from('services').select(SERVICE_COLUMNS).order('id', { ascending: true }),
  );
}

export async function addService(service: Omit<ServiceInsert, 'user_id'>): Promise<Service> {
  const userId = await currentUserId();
  return unwrap(
    await supabase
      .from('services')
      .insert({ ...service, user_id: userId })
      .select(SERVICE_COLUMNS)
      .single(),
  );
}

export async function updateService(
  updates: TablesUpdate<'services'> & { id: number },
): Promise<Service> {
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
  assertOk(await supabase.from('services').delete().eq('id', id));
}
