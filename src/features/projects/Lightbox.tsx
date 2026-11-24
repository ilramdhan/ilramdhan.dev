import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Img } from '@/components/ui/Img';
import { useT } from '@/i18n';
import { useSwipe } from './use-swipe';

export interface LightboxProps {
  images: string[];
  /** Base alt text; each image gets `<alt>: image n of N`. */
  alt: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Locks page scroll while mounted (restores the previous value on unmount). */
function useScrollLock() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);
}

const NAV_BUTTON =
  'grid size-11 place-items-center rounded-full bg-on-dark/10 text-on-dark transition-[background-color,scale] duration-200 ease-apple hover:bg-on-dark/20 active:scale-[0.96] motion-reduce:transition-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-on-dark';

/**
 * Full-screen image viewer (T-52), loaded lazily by `ProjectGallery` on first open: the
 * whole image (`object-contain`), prev/next buttons, ←/→ keys, swipe, "n / N" and the
 * image's alt text. Esc, focus trap and focus return come from `Dialog`.
 */
export default function Lightbox({ images, alt, index, onIndexChange, onClose }: LightboxProps) {
  const t = useT();
  const count = images.length;
  const go = (delta: number) => onIndexChange((index + delta + count) % count);
  const swipe = useSwipe((direction) => {
    if (count > 1) go(direction);
  });
  useScrollLock();

  useEffect(() => {
    if (count < 2) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      onIndexChange((index + (e.key === 'ArrowRight' ? 1 : -1) + count) % count);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [count, index, onIndexChange]);

  const label = count > 1 ? t.gallery.imageOf(alt, index + 1, count) : alt;

  return (
    <Dialog
      open
      onClose={onClose}
      title={t.gallery.viewer}
      overlayClassName="fixed inset-0 z-60 bg-night/95 motion-safe:animate-page-in"
      className="flex h-full w-full flex-col text-on-dark outline-hidden"
    >
      <div className="flex items-center justify-between gap-4 p-3 sm:p-4">
        <p
          className="text-sm tabular-nums text-on-dark-muted"
          aria-live="polite"
          aria-atomic="true"
        >
          {index + 1} / {count}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.gallery.closeViewer}
          className={NAV_BUTTON}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <figure className="flex min-h-0 flex-1 flex-col">
        <div
          {...swipe}
          style={{ touchAction: 'pan-y' }}
          className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        >
          <Img
            key={images[index]}
            src={images[index]!}
            alt={label}
            width={1600}
            height={900}
            priority
            sizes="100vw"
            draggable={false}
            className="max-h-full max-w-full select-none object-contain"
          />
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t.gallery.prev}
                className={`${NAV_BUTTON} absolute left-2 top-1/2 -translate-y-1/2 sm:left-4`}
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t.gallery.next}
                className={`${NAV_BUTTON} absolute right-2 top-1/2 -translate-y-1/2 sm:right-4`}
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <figcaption className="wrap-break-word p-3 text-center text-sm text-on-dark-muted sm:p-4">
          {label}
        </figcaption>
      </figure>
    </Dialog>
  );
}
