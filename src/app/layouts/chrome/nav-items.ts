import { siteConfig } from '@/config/site';
import { localePath, splitLocale, useT, type Locale } from '@/i18n';

/** The brand name the nav shows (constant: the link's accessible name never changes, nothing re-measures). */
export const BRAND_NAME = siteConfig.name;

export type NavItem = { id: string; label: string; href: string };

/** Section links. None of our sections has child pages, so there are no flyouts (mutugading: flyouts only for those). */
export function useNavItems(): NavItem[] {
  const t = useT().nav;
  return [
    { id: 'about', label: t.about, href: '/about' },
    { id: 'certificates', label: t.certificates, href: '/certificates' },
    { id: 'projects', label: t.projects, href: '/projects' },
    { id: 'blog', label: t.blog, href: '/blog' },
    { id: 'contact', label: t.contact, href: '/#contact' },
  ];
}

/** The current page in `locale`: same path, search and hash (admin/login stay unprefixed). */
export function samePageIn(
  locale: Locale,
  loc: { pathname: string; search: string; hash: string },
): string {
  return `${localePath(splitLocale(loc.pathname).path, locale)}${loc.search}${loc.hash}`;
}
