import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Img } from '@/components/ui/Img';

const loadLightbox = () => import('./Lightbox');
/** Client-only and loaded on first open, so it isn't in the route's initial JS. */
const Lightbox = lazy(loadLightbox);

interface ProjectGalleryProps {
  images: string[];
  /** Base alt text, e.g. "Screenshot of <title>". */
  alt: string;
}

/**
 * Thumbnail strip under the project carousel (T-52). Each thumbnail is a button that opens
 * the lightbox at that image; nothing else is rendered until then, so the prerendered
 * markup and the hydrated markup are the same.
 */
export function ProjectGallery({ images, alt }: ProjectGalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const opened = useRef<number>(0);
  const count = images.length;

  const close = useCallback(() => {
    setOpen(null);
    // Dialog restores focus too; this covers browsers that don't focus a clicked button.
    requestAnimationFrame(() => triggers.current[opened.current]?.focus());
  }, []);

  if (count === 0) return null;

  return (
    <>
      <ul aria-label="Gallery" className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
        {images.map((src, i) => (
          <li key={`${i}-${src}`}>
            <button
              type="button"
              ref={(el) => {
                triggers.current[i] = el;
              }}
              aria-label={`Open image ${i + 1} of ${count} full screen`}
              aria-haspopup="dialog"
              onPointerEnter={() => void loadLightbox()}
              onFocus={() => void loadLightbox()}
              onClick={() => {
                opened.current = i;
                setOpen(i);
              }}
              className="group/thumb relative block aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-white/10 dark:bg-slate-900"
            >
              <Img
                src={src}
                alt=""
                width={1600}
                height={900}
                sizes="(min-width: 640px) 10rem, 25vw"
                className="h-full w-full object-cover transition-opacity group-hover/thumb:opacity-80"
              />
              <span className="absolute right-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100">
                <Maximize2 className="h-3 w-3" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <Suspense fallback={null}>
          <Lightbox
            images={images}
            alt={alt}
            index={open}
            onIndexChange={setOpen}
            onClose={close}
          />
        </Suspense>
      )}
    </>
  );
}
