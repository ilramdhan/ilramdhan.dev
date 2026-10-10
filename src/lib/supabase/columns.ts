import type { Database, Tables } from '@/types';

type TableName = keyof Database['public']['Tables'];

/** `['a', 'b', 'c']` → `'a,b,c'` at the type level, so supabase-js can type the result. */
type Join<T extends readonly string[]> = T extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? Tail extends readonly []
    ? Head
    : `${Head},${Join<Tail>}`
  : string;

/**
 * Builds an explicit `select()` column list for `table` (T-15: no `select('*')`).
 * Every name is checked against the generated `types/database.ts`, and the joined
 * string keeps its literal type, so query results are typed as `Pick<Row, ...>`.
 *
 *   const PROJECT_CARD = columns('projects', 'id', 'slug', 'title');
 *   supabase.from('projects').select(PROJECT_CARD) // → { id; slug; title }[]
 */
export function columns<T extends TableName, const K extends readonly (keyof Tables<T> & string)[]>(
  _table: T,
  ...names: K
): Join<K> {
  return names.join(',') as Join<K>;
}
