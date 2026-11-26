import { Link } from 'react-router';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { Chevron, linkChevronClass } from './LinkChevron';
import { pillClass } from './pill';

/** Our own domain and its subdomains open in the same tab; everything else opens a new one. */
const OWN_DOMAIN = new RegExp(
  `^https://([a-z0-9-]+\\.)?${new URL(siteConfig.url).hostname.replace(/\./g, '\\.')}(/|$)`,
);

export type ActionTarget = {
  kind: 'internal' | 'external' | 'download' | 'mailto' | 'tel';
  href: string;
  label: string;
};

export type ActionLinkProps = {
  link: ActionTarget;
  /** primary = filled pill; secondary = text link with chevron. */
  variant?: 'primary' | 'secondary';
  className?: string;
};

/** Any link in the Apple vocabulary: a pill or a chevron link, with the right element for its kind. */
export function ActionLink({ link, variant = 'secondary', className }: ActionLinkProps) {
  const primary = variant === 'primary';
  const cls = cn(primary ? pillClass('md') : linkChevronClass, className);
  const body = (
    <>
      {link.label}
      {primary ? null : <Chevron />}
    </>
  );
  switch (link.kind) {
    case 'internal':
      return (
        <Link to={link.href} className={cls}>
          {body}
        </Link>
      );
    case 'external':
      return (
        <a
          href={link.href}
          {...(OWN_DOMAIN.test(link.href)
            ? { rel: 'noopener' }
            : { target: '_blank', rel: 'noopener noreferrer' })}
          className={cls}
        >
          {body}
        </a>
      );
    case 'download':
      return (
        <a href={link.href} download className={cls}>
          {body}
        </a>
      );
    default: {
      // mailto / tel: accept both "mailto:x" and a bare address.
      const prefix = link.kind === 'mailto' ? 'mailto:' : 'tel:';
      const href = link.href.startsWith(prefix) ? link.href : `${prefix}${link.href}`;
      return (
        <a href={href} className={cls}>
          {body}
        </a>
      );
    }
  }
}
