import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildHead, type HeadDescriptor, type SeoProps } from './seo-head';

export type { SeoProps };

function upsertMeta(attr: string, key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attr: string, key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function apply(head: HeadDescriptor) {
  document.title = head.title;
  const keep = new Set<string>();
  for (const [attr, key, content] of head.meta) {
    upsertMeta(attr, key, content);
    keep.add(`${attr}:${key}`);
  }
  for (const key of ['og:url', 'twitter:url']) {
    const attr = key.startsWith('og:') ? 'property' : 'name';
    if (!keep.has(`${attr}:${key}`)) removeMeta(attr, key);
  }
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (head.canonical) {
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = head.canonical;
  } else {
    link?.remove();
  }
}

/**
 * The single place that owns page metadata. Render one per page; on unmount (route
 * change) everything is reset to neutral site defaults before the next page's `<Seo>`
 * applies its own, so no tag can leak from one route to another.
 *
 * Implemented directly against `document.head` (no helmet dependency) to keep the
 * shared bundle within its budget.
 */
export function Seo(props: SeoProps) {
  const { pathname } = useLocation();
  const { title, description, path, image, type, noindex } = props;

  useEffect(() => {
    apply(buildHead({ title, description, path, image, type, noindex }, pathname));
  }, [title, description, path, image, type, noindex, pathname]);

  useEffect(
    () => () => {
      apply({ ...buildHead({}, '/'), canonical: null });
    },
    [],
  );

  return null;
}
