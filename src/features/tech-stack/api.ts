import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
import { assertOk, unwrap, withoutId } from '@/lib/supabase/result';

export const TECH_STACK_COLUMNS = columns('tech_stack', 'id', 'name', 'category', 'icon_url');

export type TechStack = Pick<Tables<'tech_stack'>, 'id' | 'name' | 'category' | 'icon_url'>;
export type TechStackInsert = TablesInsert<'tech_stack'>;

export async function getTechStack(): Promise<TechStack[]> {
  return unwrap(
    await supabase.from('tech_stack').select(TECH_STACK_COLUMNS).order('name', { ascending: true }),
  );
}

export async function addTechStack(tech: TechStackInsert): Promise<TechStack> {
  return unwrap(await supabase.from('tech_stack').insert(tech).select(TECH_STACK_COLUMNS).single());
}

export async function updateTechStack(
  updates: TablesUpdate<'tech_stack'> & { id: number },
): Promise<TechStack> {
  return unwrap(
    await supabase
      .from('tech_stack')
      .update(withoutId(updates))
      .eq('id', updates.id)
      .select(TECH_STACK_COLUMNS)
      .single(),
  );
}

export async function deleteTechStack(id: number): Promise<void> {
  assertOk(await supabase.from('tech_stack').delete().eq('id', id));
}
