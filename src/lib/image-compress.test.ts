import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImage, dimensionsFromUrl, fitWithin, TARGET_IMAGE_BYTES } from './image-compress';

describe('fitWithin', () => {
  it('scales the longest edge down to the limit, keeping the aspect ratio', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(1000, 3000, 512)).toEqual({ width: 171, height: 512 });
  });
  it('never upscales', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe('dimensionsFromUrl', () => {
  it('reads _<w>x<h> from uploaded names', () => {
    expect(dimensionsFromUrl('https://x.supabase.co/a/projects/abc_1600x900.webp')).toEqual({
      width: 1600,
      height: 900,
    });
    expect(dimensionsFromUrl('/p/abc_512x512.webp?v=1')).toEqual({ width: 512, height: 512 });
  });
  it('returns null for legacy names', () => {
    expect(dimensionsFromUrl('https://x.supabase.co/a/projects/abc.png')).toBeNull();
    expect(dimensionsFromUrl(null)).toBeNull();
  });
});

describe('compressImage', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Fakes createImageBitmap + canvas.toBlob; `sizes` are the encoded sizes per quality step. */
  function stubCanvas(
    bitmap: { width: number; height: number },
    sizes: number[],
    type = 'image/webp',
  ) {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ ...bitmap, close }));
    const qualities: number[] = [];
    let call = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as ReturnType<HTMLCanvasElement['getContext']>);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb, _t, q) {
      qualities.push(q as number);
      cb(new Blob([new Uint8Array(sizes[Math.min(call++, sizes.length - 1)]!)], { type }));
    });
    return { qualities, close };
  }

  it('resizes a large photo to 1600 px WebP under the target size', async () => {
    const { qualities, close } = stubCanvas({ width: 4000, height: 3000 }, [350 * 1024]);
    const input = new Blob([new Uint8Array(4 * 1024 * 1024)], { type: 'image/jpeg' });
    const result = await compressImage(input);
    expect(result).toMatchObject({ width: 1600, height: 1200 });
    expect(result!.blob.type).toBe('image/webp');
    expect(result!.blob.size).toBeLessThanOrEqual(TARGET_IMAGE_BYTES);
    expect(qualities).toEqual([0.8]);
    expect(close).toHaveBeenCalled();
  });

  it('steps quality down until the image fits the target', async () => {
    const { qualities } = stubCanvas({ width: 3000, height: 3000 }, [900e3, 600e3, 380e3]);
    const result = await compressImage(new Blob([new Uint8Array(5e6)], { type: 'image/png' }));
    expect(qualities).toEqual([0.8, 0.7, 0.6]);
    expect(result!.blob.size).toBe(380e3);
  });

  it('keeps the original when the browser cannot encode WebP', async () => {
    stubCanvas({ width: 3000, height: 2000 }, [100], 'image/png');
    expect(await compressImage(new Blob([new Uint8Array(10)]))).toBeNull();
  });

  it('keeps a small original that WebP would not shrink', async () => {
    stubCanvas({ width: 200, height: 200 }, [5000]);
    expect(await compressImage(new Blob([new Uint8Array(4000)]))).toBeNull();
  });

  it('keeps the original when the image cannot be decoded', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad image')));
    expect(await compressImage(new Blob([new Uint8Array(10)]))).toBeNull();
  });
});
