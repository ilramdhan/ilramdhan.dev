import type { ElementType } from 'react';
import { Gamepad2, Github, Instagram, Linkedin, Mail, Phone, Twitter, Youtube } from 'lucide-react';
import { ensureFullUrl } from '@/lib/utils';

/** The single source of truth for supported social platforms. */
const SOCIAL_ICONS: Record<string, ElementType> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  mail: Mail,
  whatsapp: Phone,
  steam: Gamepad2,
};

interface SocialLinksProps {
  links: unknown;
  containerClassName: string;
  linkClassName: string;
  iconClassName: string;
}

/** Icon links for a profile's `social_links` JSON; unknown keys and empty values are skipped. */
export function SocialLinks({
  links,
  containerClassName,
  linkClassName,
  iconClassName,
}: SocialLinksProps) {
  return (
    <div className={containerClassName}>
      {!!links &&
        typeof links === 'object' &&
        Object.entries(links).map(([key, value]) => {
          if (!value) return null;
          const Icon = SOCIAL_ICONS[key];
          if (!Icon) return null;
          // social_links values are URLs / addresses stored as strings.
          const link = value as string;
          const href = key === 'mail' ? `mailto:${link}` : ensureFullUrl(link) || '#';
          return (
            <a key={key} href={href} target="_blank" rel="noreferrer" className={linkClassName}>
              <Icon className={iconClassName} />
            </a>
          );
        })}
    </div>
  );
}
