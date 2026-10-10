import type { Tables, TablesInsert } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { columns } from '@/lib/supabase/columns';
import { assertOk, unwrap } from '@/lib/supabase/result';

export const MESSAGE_COLUMNS = columns(
  'messages',
  'id',
  'name',
  'email',
  'message',
  'is_read',
  'created_at',
);

export type Message = Tables<'messages'>;
export type MessageInsert = TablesInsert<'messages'>;

/** Admin inbox, newest first (RLS: admins only). */
export async function getMessages(): Promise<Message[]> {
  return unwrap(
    await supabase
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .order('created_at', { ascending: false }),
  );
}

/** Public contact form. No `select()`: anon may insert but not read messages. */
export async function addMessage(message: MessageInsert): Promise<{ success: true }> {
  assertOk(await supabase.from('messages').insert(message));
  return { success: true };
}

export async function deleteMessage(id: number): Promise<void> {
  assertOk(await supabase.from('messages').delete().eq('id', id));
}

export async function markMessageAsRead(id: number): Promise<Message> {
  return unwrap(
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .select(MESSAGE_COLUMNS)
      .single(),
  );
}

export async function markAllMessagesAsRead(): Promise<Message[]> {
  return unwrap(
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('is_read', false)
      .select(MESSAGE_COLUMNS),
  );
}
