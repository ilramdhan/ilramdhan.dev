import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { Chevron, linkChevronClass } from '@/components/tile/LinkChevron';
import { useT } from '@/i18n';

const noSubscribe = () => () => {};

interface ShareBarProps {
  title: string;
  /** Absolute canonical URL of the page. */
  url: string;
}

/**
 * Share actions as chevron text links (mutugading): the system share sheet where the Web Share API exists (decided
 * after mount, so the prerendered markup never depends on the browser), copy link, X, LinkedIn.
 */
export function ShareBar({ title, url }: ShareBarProps) {
  const t = useT();
  const canShare = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === 'function',
    () => false,
  );

  const share = () => {
    navigator.share({ title, url }).catch(() => {
      // dismissed by the visitor
    });
  };
  const copy = () => {
    if (!navigator.clipboard) {
      toast.error(t.article.copyUnsupported);
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => toast.success(t.article.copied),
      () => toast.error(t.article.copyFailed),
    );
  };
  const enc = encodeURIComponent;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      <span className="text-caption font-semibold text-tile-ink">{t.article.share}</span>
      {canShare && (
        <button type="button" onClick={share} className={linkChevronClass}>
          {t.article.shareMore}
          <Chevron />
        </button>
      )}
      <button type="button" onClick={copy} className={linkChevronClass}>
        {t.article.copyLink}
        <Chevron />
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkChevronClass}
        aria-label={t.article.shareOnX}
      >
        X
        <Chevron />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkChevronClass}
        aria-label={t.article.shareOnLinkedIn}
      >
        LinkedIn
        <Chevron />
      </a>
    </div>
  );
}
