/** Postgres "undefined column" / PostgREST "column not in schema cache" for `translations`. */
function isMissingTranslations(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { code, message } = error as { code?: string; message?: string };
  return (
    (code === '42703' || code === 'PGRST204' || code === 'PGRST100') &&
    /translations/.test(message ?? '')
  );
}

// ponytail: remembered per page load; drop it (and the retry) once the migration is
// applied everywhere and the column can be selected unconditionally.
let missing = false;

/**
 * Runs a select with the `translations` column added when `wanted`, so the frontend works
 * before the T-41 migration is applied: if the column does not exist yet the query is
 * repeated without it (rows then stay English). English public pages never ask for it.
 */
export async function selectWithTranslations<R extends { error: unknown }>(
  wanted: boolean,
  cols: string,
  run: (cols: string) => PromiseLike<R>,
): Promise<R> {
  if (!wanted || missing) return run(cols);
  const result = await run(`${cols},translations`);
  if (!isMissingTranslations(result.error)) return result;
  missing = true;
  return run(cols);
}

/** Test hook: forget that the column was missing. */
export const resetTranslationsProbe = () => {
  missing = false;
};
