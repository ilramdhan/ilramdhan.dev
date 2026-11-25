import type { ReactNode } from 'react';
import { LinkChevron } from '@/components/tile/LinkChevron';
import { MediaFrame } from '@/components/tile/MediaFrame';
import type { Certificate } from '@/features/certificates/api';
import { formatDate } from '@/lib/date';
import { useLocale, useT } from '@/i18n';

/**
 * One certificate as a linked group (no card): the certificate image in a MediaFrame, title, issuer, dates and one
 * clamped line. With a credential URL the whole group is the link (the photo zooms 1.02 on hover, like every linked
 * group); without one it is plain text and the photo never reacts to the pointer.
 */
export function CertificateCard({ cert, priority }: { cert: Certificate; priority?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const link = cert.credential_url;
  // ponytail: strips the inline Markdown marks this field uses; use `plainText` (features/home) if richer content shows.
  const description = (cert.description ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>~]+/g, '')
    .trim();
  const body: ReactNode = (
    <>
      <MediaFrame
        src={cert.file_url}
        alt={cert.file_url ? t.certificates.alt(cert.title, cert.issued_by) : ''}
        width={1600}
        height={1200}
        aspect="landscape"
        priority={priority}
        interactive={!!link}
      />
      <h3 className="mt-4 text-title text-tile-ink">{cert.title}</h3>
      {cert.issued_by ? <p className="mt-1 text-body text-tile-ink">{cert.issued_by}</p> : null}
      <p className="mt-1 text-caption text-tile-muted">
        {formatDate(cert.issued_date, locale)}
        {cert.expiry_date ? ` - ${formatDate(cert.expiry_date, locale)}` : ''}
      </p>
      {description ? (
        <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-[1.4] text-pretty text-tile-muted">
          {description}
        </p>
      ) : null}
      {link ? (
        <LinkChevron className="mt-2 group-hover:underline">
          {t.certificates.viewCredential}
        </LinkChevron>
      ) : null}
    </>
  );
  const cls = 'group flex h-full flex-col items-start text-left';
  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
