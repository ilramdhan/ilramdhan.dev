// Relative on purpose: also bundled into the Vercel function (api/), which ignores tsconfig paths.
import { absoluteUrl, siteConfig } from '../../config/site';

export interface SeoProps {
  /** Page title; rendered as `<title> | <site name>`. Omit for the site default title. */
  title?: string;
  description?: string;
  /** Site-relative path used for the canonical URL. Defaults to the current location. */
  path?: string;
  /** Social image: absolute URL or site-relative path. */
  image?: string;
  /** Open Graph type. */
  type?: 'website' | 'article';
  /** Adds `noindex` and drops the canonical (login, admin, 404). */
  noindex?: boolean;
}

/**
 * Everything `<Seo>` writes to `<head>`, as plain data. Later tasks extend this single
 * description (OG image variants in T-36, JSON-LD in T-38) instead of adding new tags
 * from individual pages.
 */
export interface HeadDescriptor {
  title: string;
  /** `[attribute, key, content]`, e.g. `['name', 'description', '...']`. */
  meta: Array<['name' | 'property', string, string]>;
  /** Canonical URL, or `null` for no canonical. */
  canonical: string | null;
}

export function buildHead(props: SeoProps, pathname: string): HeadDescriptor {
  const title = props.title ? `${props.title} | ${siteConfig.name}` : siteConfig.title;
  const description = props.description || siteConfig.metaDescription;
  const canonical = props.noindex ? null : absoluteUrl(props.path ?? pathname);
  const image = absoluteUrl(props.image || siteConfig.ogDefaultImage);
  const meta: HeadDescriptor['meta'] = [
    ['name', 'robots', props.noindex ? 'noindex, nofollow' : 'index, follow'],
    ['name', 'description', description],
    ['name', 'title', title],
    ['property', 'og:type', props.type ?? 'website'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:image', image],
    ['property', 'og:site_name', siteConfig.name],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
  ];
  if (canonical) {
    meta.push(['property', 'og:url', canonical], ['name', 'twitter:url', canonical]);
  }
  return { title, meta, canonical };
}
