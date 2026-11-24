// ponytail: switch to i18next only if pluralisation/ICU needs grow (plain functions in the
// dictionaries cover "n items" and interpolation today). `en` is bundled; `id` is its own
// chunk (bundle budget) that `loadLocale` fetches BEFORE hydrating/rendering an /id page, so
// a prerendered page still never suspends or mismatches.
import { createContext, useContext } from 'react';
import { localePath, type Locale } from './locale';
import { en, type Messages } from './messages/en';

export { localePath, splitLocale, alternatesFor, LOCALES, type Locale } from './locale';
export type { Messages } from './messages/en';

let id: Messages | null = null;

/** Fetches a locale's dictionary; await it before rendering that locale (no-op for `en`). */
export async function loadLocale(locale: Locale): Promise<void> {
  if (locale === 'id' && !id) id = (await import('./messages/id')).id;
}

const dictionaries = (locale: Locale): Messages => (locale === 'id' && id ? id : en);

/** Provided by the route tree from the URL; defaults to `en` (unit tests, error screens). */
export const LocaleContext = createContext<Locale>('en');

export const useLocale = (): Locale => useContext(LocaleContext);

/** The active locale's message dictionary: `const t = useT(); t.nav.home`. */
export const useT = (): Messages => dictionaries(useLocale());

/** For class components and non-React code. */
export const dictionaryFor = (locale: Locale): Messages => dictionaries(locale);

/** `(path) => path` prefixed for the active locale, for `<Link to>`/`navigate`. */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale();
  return (path) => localePath(path, locale);
}
