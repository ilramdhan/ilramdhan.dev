import type { Locale } from './locale';

/** Rows served to public pages: translated where possible, plus whether they were. */
export type Localized<T> = T & {
  /** `false` only when a non-default locale was asked for and the row has no translation. */
  isTranslated?: boolean;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Overlays `row.translations[locale]` on the English base columns, per field: a missing,
 * empty or non-string translation falls back to the base value. The `translations` column
 * itself is dropped from the result. A row without that key (column not migrated yet, or
 * not selected) simply stays English with `isTranslated: false` for non-default locales.
 */
export function localize<T extends object>(
  row: T,
  locale: Locale,
  fields: readonly string[],
): Localized<T> {
  const { translations, ...base } = row as T & { translations?: unknown };
  if (locale === 'en') return { ...base, isTranslated: true } as Localized<T>;
  const mine = isRecord(translations) ? translations[locale] : undefined;
  const over: Record<string, string> = {};
  if (isRecord(mine)) {
    for (const field of fields) {
      const value = mine[field];
      if (typeof value === 'string' && value.trim() !== '') over[field] = value;
    }
  }
  return { ...base, ...over, isTranslated: Object.keys(over).length > 0 } as Localized<T>;
}

export const localizeAll = <T extends object>(
  rows: readonly T[],
  locale: Locale,
  fields: readonly string[],
): Localized<T>[] => rows.map((r) => localize(r, locale, fields));
