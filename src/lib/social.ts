import { ensureFullUrl } from '@/lib/utils';

/** Supported `profile.social_links` keys (icons in components/ui/SocialLinks, names in messages `footer.socialName`). */
export const SOCIAL_KEYS = [
  'github',
  'linkedin',
  'twitter',
  'instagram',
  'youtube',
  'mail',
  'whatsapp',
  'steam',
] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

const isSocialKey = (key: string): key is SocialKey =>
  (SOCIAL_KEYS as readonly string[]).includes(key);

/** `[platform, href]` for every supported, non-empty entry of a profile's `social_links` JSON (in stored order). */
export function socialEntries(links: unknown): Array<[SocialKey, string]> {
  if (!links || typeof links !== 'object') return [];
  return Object.entries(links).flatMap(([key, value]): Array<[SocialKey, string]> => {
    if (!value || typeof value !== 'string' || !isSocialKey(key)) return [];
    const href = key === 'mail' ? `mailto:${value}` : ensureFullUrl(value);
    return href ? [[key, href]] : [];
  });
}
