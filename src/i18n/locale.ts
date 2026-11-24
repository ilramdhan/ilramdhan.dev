// Relative import on purpose: also bundled into the Vercel function (api/), which ignores tsconfig paths.
import { siteConfig } from '../config/site';

/** `en` lives at `/`, every other locale under its own prefix (`/id/...`). Slugs are shared. */
export type Locale = 'en' | 'id';
export const LOCALES: readonly Locale[] = ['en', 'id'];
export const DEFAULT_LOCALE: Locale = 'en';

export const OG_LOCALE: Record<Locale, string> = { en: 'en_US', id: 'id_ID' };

const PREFIX = /^\/id(?=[/?#]|$)/;

/** Splits a pathname into its locale and the locale-free path (`/id/blog` -> id, `/blog`). */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  if (!PREFIX.test(pathname)) return { locale: DEFAULT_LOCALE, path: pathname || '/' };
  return { locale: 'id', path: pathname.replace(PREFIX, '') || '/' };
}

/** `/blog?tag=x`, `/#contact` or `/` for `locale`; already-prefixed paths are re-prefixed. */
export function localePath(path: string, locale: Locale): string {
  // Admin and login are English-only (no /id/admin): never prefixed.
  if (/^\/(admin|login)(?=[/?#]|$)/.test(path)) return path;
  const bare = path.replace(PREFIX, '') || '/';
  if (locale === DEFAULT_LOCALE) return bare;
  const [, body = '', tail = ''] = /^\/?([^?#]*)(.*)$/.exec(bare) ?? [];
  return `/id${body ? `/${body}` : ''}${tail}`;
}

/** Every language version of a page, plus `x-default` (the default locale). */
export function alternatesFor(path: string): Array<{ hreflang: string; path: string }> {
  const bare = splitLocale(path).path;
  return [
    ...LOCALES.map((l) => ({ hreflang: l, path: localePath(bare, l) })),
    { hreflang: 'x-default', path: localePath(bare, DEFAULT_LOCALE) },
  ];
}

/** Absolute URL of `path` in `locale`. */
export const localeUrl = (path: string, locale: Locale) =>
  new URL(localePath(path, locale), siteConfig.url).toString();
