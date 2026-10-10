import { isMissingFunctionError, toAppError } from '@/lib/errors';
import { supabase } from './client';

type DistinctFunction = 'project_tags' | 'blog_tags' | 'certificate_issuers';

/** Sorted, de-duplicated, non-empty values. */
export function distinctSorted(values: Iterable<string | null | undefined>): string[] {
  const unique = new Set<string>();
  for (const value of values) if (value) unique.add(value);
  return [...unique].sort((a, b) => a.localeCompare(b));
}

/**
 * Distinct values computed by a database function (`select distinct unnest(tags)`), so
 * the browser no longer downloads a column of every row. The migration `20261010200000_distinct_values_user_id_default.sql` is
 * applied on prod; `fallback` (the old column scan) is kept for resilience if the function
 * is missing (fresh or restored DB, local dev before migrating).
 */
export async function fetchDistinct(
  fn: DistinctFunction,
  fallback: () => Promise<string[]>,
): Promise<string[]> {
  const { data, error, status } = await supabase.rpc(fn);
  if (!error) return distinctSorted(data ?? []);
  if (isMissingFunctionError(error, status)) return fallback();
  throw toAppError(error, status);
}
