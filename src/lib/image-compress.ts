/**
 * Client-side image compression for admin uploads (T-27). Supabase image transforms are
 * not on the free tier, so images are resized and re-encoded as WebP in the browser
 * before they reach Storage. Uses the built-in canvas encoder: no extra dependency.
 */

/** Longest-edge limits per upload folder (px). */
export const MAX_IMAGE_EDGE: Record<string, number> = {
  avatars: 512,
  logos: 256,
};
export const DEFAULT_MAX_IMAGE_EDGE = 1600;

/** Stored images aim to stay under this size; quality steps down until they do. */
export const TARGET_IMAGE_BYTES = 400 * 1024;
const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5];

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

/** Scales `width`×`height` down (never up) so the longest edge is at most `maxEdge`. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
}

/**
 * Resizes `file` to fit `maxEdge` and encodes it as WebP. Returns `null` when the browser
 * cannot decode the image or encode WebP, or when the result would not be smaller than
 * an original that needed no resizing; the caller then uploads the original.
 */
export async function compressImage(
  file: Blob,
  maxEdge = DEFAULT_MAX_IMAGE_EDGE,
): Promise<CompressedImage | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);

    let blob: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      blob = await encode(canvas, quality);
      // Older Safari silently returns PNG for unsupported types: keep the original.
      if (!blob || blob.type !== 'image/webp') return null;
      if (blob.size <= TARGET_IMAGE_BYTES) break;
    }
    if (!blob) return null;
    const resized = width !== bitmap.width || height !== bitmap.height;
    if (!resized && blob.size >= file.size) return null;
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

/** Width/height encoded in an uploaded image name (`<uuid>_<w>x<h>.webp`), if present. */
export function dimensionsFromUrl(
  url: string | null | undefined,
): { width: number; height: number } | null {
  const match = url?.match(/_(\d{1,5})x(\d{1,5})\.\w+(?:[?#]|$)/);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? { width, height } : null;
}
