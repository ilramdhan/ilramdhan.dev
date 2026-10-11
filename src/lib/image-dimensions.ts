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
