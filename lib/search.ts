/**
 * Helpers for building safe PostgREST `ilike` filters from user input (T-10, #25).
 *
 * - `%` and `_` are LIKE wildcards and `\` is the LIKE escape character, so they
 *   are escaped with a backslash to match literally.
 * - PostgREST turns every `*` in a like/ilike value into `%` and offers no escape
 *   for it, so a literal `*` becomes `_` (matches any single character).
 * - Inside `.or()` the value is double-quoted, so `,` `.` `(` `)` `:` can't change
 *   the filter structure; `"` and `\` are backslash-escaped for the PostgREST parser.
 */

/** Escapes LIKE wildcards in `input` so it matches literally. */
export function escapeIlike(input: string): string {
  return input.replace(/[\\%_]/g, '\\$&').replace(/\*/g, '_');
}

/** `%…%` "contains" pattern for `input`, or `null` when there is nothing to search for. */
export function ilikeContains(input: string | null | undefined): string | null {
  const term = (input ?? '').trim();
  return term ? `%${escapeIlike(term)}%` : null;
}

/** Double-quotes a value for use inside a PostgREST logic filter such as `or=(…)`. */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/["\\]/g, '\\$&')}"`;
}

/**
 * `.or()` filter matching `input` (case-insensitive "contains") in any of `columns`,
 * or `null` when the input is blank.
 */
export function orIlikeFilter(columns: readonly string[], input: string | null | undefined) {
  const pattern = ilikeContains(input);
  if (pattern === null) return null;
  const value = quoteFilterValue(pattern);
  return columns.map((column) => `${column}.ilike.${value}`).join(',');
}
