import type { ImgHTMLAttributes } from 'react';
import { dimensionsFromUrl } from '@/lib/image-compress';

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'width' | 'height'> & {
  src: string;
  /** Required: describe the image, or pass "" for purely decorative images. */
  alt: string;
  /**
   * Intrinsic size used when the URL doesn't encode one (`_<w>x<h>` from uploads, T-27).
   * Only the ratio matters for layout; the CSS box still decides the rendered size.
   */
  width: number;
  height: number;
  /** The LCP image: load eagerly with high fetch priority. Everything else is lazy. */
  priority?: boolean;
};

/**
 * Public-site `<img>` (T-27): always has `width`/`height` (so the browser reserves its box
 * before it loads), `alt`, `decoding="async"`, and `loading="lazy"` unless `priority`.
 */
export function Img({ src, alt, width, height, priority = false, ...rest }: ImgProps) {
  const size = dimensionsFromUrl(src) ?? { width, height };
  return (
    <img
      src={src}
      alt={alt}
      width={size.width}
      height={size.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      {...rest}
    />
  );
}
