import type { ElementType } from 'react';
import { Gamepad2, Mail, Phone } from 'lucide-react';
import { Github, Instagram, Linkedin, Twitter, Youtube } from '@/components/ui/brand-icons';
import { useT } from '@/i18n';
import { socialEntries, type SocialKey } from '@/lib/social';

/** The single source of truth for supported social platforms. */
const SOCIAL_ICONS = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  mail: Mail,
  whatsapp: Phone,
  steam: Gamepad2,
} satisfies Record<SocialKey, ElementType>;

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
  const t = useT();
  return (
    <div className={containerClassName}>
      {socialEntries(links).map(([key, href]) => {
        const Icon = SOCIAL_ICONS[key];
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={t.footer.socialName[key]}
            className={linkClassName}
          >
            <Icon aria-hidden="true" className={iconClassName} />
          </a>
        );
      })}
    </div>
  );
}
