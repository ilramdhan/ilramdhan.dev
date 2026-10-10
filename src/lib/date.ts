export type DateStyle = 'short' | 'medium' | 'long';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { year: 'numeric', month: 'numeric', day: 'numeric' },
  medium: { year: 'numeric', month: 'short', day: 'numeric' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
};

/** Locale used for dates until i18n (T-40) provides one. */
export const DEFAULT_LOCALE = 'en';

/**
 * Formats a date consistently ("Oct 10, 2026" for `en`, "10 Okt 2026" for `id`).
 * Date-only strings (`2025-01-01`) are formatted in UTC so they never shift a day.
 * Returns '' for empty or invalid input.
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  locale: string = DEFAULT_LOCALE,
  style: DateStyle = 'medium',
): string {
  if (date === null || date === undefined || date === '') return '';
  const dateOnly = typeof date === 'string' && DATE_ONLY.test(date);
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return typeof date === 'string' ? date : '';
  return new Intl.DateTimeFormat(locale, {
    ...OPTIONS[style],
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  }).format(value);
}
