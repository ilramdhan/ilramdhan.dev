import { useEffect, useState } from 'react';
import { Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareBarProps {
  title: string;
  /** Absolute canonical URL of the page. */
  url: string;
}

const button =
  'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-500/50 hover:text-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-indigo-400';

/**
 * Share actions: the system share sheet where the Web Share API exists (decided after
 * mount, so the prerendered markup never depends on the browser), copy link, X, LinkedIn.
 */
export function ShareBar({ title, url }: ShareBarProps) {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === 'function'), []);

  const share = () => {
    navigator.share({ title, url }).catch(() => {
      // dismissed by the visitor
    });
  };
  const copy = () => {
    if (!navigator.clipboard) {
      toast.error('Copying is not supported in this browser.');
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied to clipboard'),
      () => toast.error('Could not copy the link.'),
    );
  };
  const enc = encodeURIComponent;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-slate-900 dark:text-white">Share</span>
      {canShare && (
        <button type="button" onClick={share} className={button}>
          <Share2 className="h-4 w-4" aria-hidden="true" /> Share…
        </button>
      )}
      <button type="button" onClick={copy} className={button}>
        <Link2 className="h-4 w-4" aria-hidden="true" /> Copy link
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={button}
        aria-label="Share on X (opens in a new tab)"
      >
        X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={button}
        aria-label="Share on LinkedIn (opens in a new tab)"
      >
        LinkedIn
      </a>
    </div>
  );
}
