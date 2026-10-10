import { AuthError, toAppError } from '@/lib/errors';
import { supabase } from './client';

/** The parts of a supabase-js / PostgREST response the data layer reads. */
interface Result<T> {
  data: T | null;
  error: unknown;
  status?: number;
  count?: number | null;
}

/** Returns `data` or throws the response's error as a typed `AppError`. */
export function unwrap<T>({ data, error, status }: Result<T>): T {
  if (error) throw toAppError(error, status);
  return data as T;
}

/** Like `unwrap` for paginated lists requested with `{ count: 'exact' }`. */
export function unwrapPage<T>(result: Result<T[]>): { data: T[]; count: number } {
  return { data: unwrap(result) ?? [], count: result.count ?? 0 };
}

/** Throws (as an `AppError`) when a mutation-only response carries an error. */
export function assertOk(result: { error: unknown; status?: number }): void {
  if (result.error) throw toAppError(result.error, result.status);
}

/** Zero-based inclusive `range()` bounds for a 1-based page. */
export function pageRange(page: number, limit: number): [from: number, to: number] {
  const from = (Math.max(1, page) - 1) * limit;
  return [from, from + limit - 1];
}

/**
 * Id of the signed-in user, used to fill `user_id` on inserts. `getSession()` reads the
 * locally stored session (no request unless it must be refreshed).
 */
export async function currentUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw new AuthError('Could not get user session.', { cause: error });
  if (!session?.user?.id) throw new AuthError('User not authenticated.');
  return session.user.id;
}

/** An update body without the `id` (used only in the filter), so the primary key is never rewritten. */
export function withoutId<T extends { id: number }>(updates: T): Omit<T, 'id'> {
  const rest: Partial<T> = { ...updates };
  delete rest.id;
  return rest as Omit<T, 'id'>;
}
