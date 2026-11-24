/** `{ title: 'Halo' }`: the ID texts of a row, by field name. */
export type Translation = Record<string, string>;

/** Only the filled-in texts are kept, so an empty field means "use the English text". */
export function cleanTranslation(translation: Translation): Translation {
  return Object.fromEntries(Object.entries(translation).filter(([, v]) => v.trim() !== ''));
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** The `id` texts stored in a row's `translations` (strings only). */
export function idTranslation(translations: unknown): Translation {
  const id = isRecord(translations) ? translations.id : undefined;
  if (!isRecord(id)) return {};
  return Object.fromEntries(
    Object.entries(id).filter((e): e is [string, string] => typeof e[1] === 'string'),
  );
}

/**
 * The `translations` value to save: the row's existing translations (other locales stay
 * untouched) with `id` replaced by `idTexts`. `undefined` = send nothing: no ID text and
 * no `translations` column on the row (not migrated yet), so a save never touches a
 * column that may not exist.
 */
export function mergeTranslations(
  existing: unknown,
  idTexts: Translation,
  rowHasColumn: boolean,
): Record<string, unknown> | undefined {
  const { id: _old, ...others } = isRecord(existing) ? existing : {};
  void _old;
  const hasId = Object.keys(idTexts).length > 0;
  if (!hasId && !rowHasColumn) return undefined;
  return hasId ? { ...others, id: idTexts } : others;
}
