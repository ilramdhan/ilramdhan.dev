/**
 * URL slug for titles (projects, blog posts): lowercase ASCII words joined by "-".
 * Accents are folded ("Café" -> "cafe"); everything else non-alphanumeric is a separator.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Simple Icons slug: "C++" -> "cplusplus", "Next.js" -> "nextdotjs", "Oracle DB" -> "oracledb". */
export function simpleIconSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/[^a-z0-9]/g, '');
}

/** CDN URL of the Simple Icons logo for a technology name, or null for an empty name. */
export function simpleIconUrl(name: string | null | undefined): string | null {
  const slug = simpleIconSlug(name ?? '');
  return slug ? `https://cdn.simpleicons.org/${slug}` : null;
}
