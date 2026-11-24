// Relative imports on purpose: shared with the prerender/Vercel function (no tsconfig paths).
import { absoluteUrl, siteConfig } from '../../config/site';
import { localePath, type Locale } from '../../i18n/locale';

export type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';
const abs = (path: string) => absoluteUrl(path);

/** Drops unknown (null/undefined/empty) fields: structured data never carries invented values. */
const clean = <T extends JsonLd>(o: T): T =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length)),
  ) as T;

const author = () => ({
  '@type': 'Person',
  name: siteConfig.name,
  url: abs('/'),
});

/** Home: the person and the site, in the page's language. */
export function homeJsonLd(locale: Locale, o: { description: string; image?: string | null }) {
  const home = abs(localePath('/', locale));
  return [
    clean({
      '@context': CONTEXT,
      '@type': 'Person',
      '@id': `${abs('/')}#person`,
      name: siteConfig.name,
      url: abs('/'),
      jobTitle: siteConfig.jobTitle,
      sameAs: [siteConfig.social.github, siteConfig.social.linkedin],
      image: o.image ? abs(o.image) : undefined,
      description: o.description,
    }),
    {
      '@context': CONTEXT,
      '@type': 'WebSite',
      name: siteConfig.name,
      url: home,
      inLanguage: locale,
      description: o.description,
      author: { '@id': `${abs('/')}#person` },
    },
  ];
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

interface Detail {
  locale: Locale;
  /** Path in `locale`, e.g. `/id/blog/x`. */
  path: string;
  title: string;
  description?: string | null;
  images?: string[] | null;
  tags?: string[] | null;
  created?: string | null;
  modified?: string | null;
  crumbs: Array<{ name: string; path: string }>;
}

export function blogPostingJsonLd(d: Detail & { published?: string | null }): JsonLd[] {
  return [
    clean({
      '@context': CONTEXT,
      '@type': 'BlogPosting',
      headline: d.title,
      description: d.description,
      image: d.images?.map(abs),
      datePublished: d.published ?? d.created,
      dateModified: d.modified,
      inLanguage: d.locale,
      keywords: d.tags?.join(', '),
      url: abs(d.path),
      mainEntityOfPage: abs(d.path),
      author: author(),
    }),
    breadcrumbJsonLd(d.crumbs),
  ];
}

export function projectJsonLd(d: Detail & { repo?: string | null }): JsonLd[] {
  return [
    clean({
      '@context': CONTEXT,
      '@type': d.repo ? 'SoftwareSourceCode' : 'CreativeWork',
      name: d.title,
      description: d.description,
      image: d.images?.map(abs),
      dateCreated: d.created,
      dateModified: d.modified,
      inLanguage: d.locale,
      keywords: d.tags?.join(', '),
      url: abs(d.path),
      codeRepository: d.repo,
      author: author(),
    }),
    breadcrumbJsonLd(d.crumbs),
  ];
}
