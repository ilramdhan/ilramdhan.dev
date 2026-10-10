import { afterEach, describe, expect, it, vi } from 'vitest';

type StorageResult = { data: { path: string } | null; error: { message: string } | null };
const upload =
  vi.fn<(path: string, file: File, options: Record<string, unknown>) => Promise<StorageResult>>();
const getPublicUrl = vi.fn<(path: string) => { data: { publicUrl: string } }>();
const from = vi.fn(() => ({ upload, getPublicUrl }));
vi.mock('@/lib/supabase/client', () => ({ supabase: { storage: { from } } }));
const compressImage = vi.fn();
vi.mock('@/lib/image-compress', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./image-compress')>()),
  compressImage: (...args: unknown[]) => compressImage(...args) as unknown,
}));

const {
  MAX_UPLOAD_BYTES,
  IMAGE_MIME_TYPES,
  PDF_MIME_TYPES,
  UploadValidationError,
  acceptAttribute,
  buildUploadPath,
  uploadAll,
  uploadFile,
  validateUpload,
} = await import('./upload');

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;

const fakeFile = (name: string, type: string, size = 1024) =>
  new File([new Uint8Array(size)], name, { type });

afterEach(() => {
  compressImage.mockReset();
  upload.mockReset();
  getPublicUrl.mockReset();
  from.mockClear();
});

describe('validateUpload', () => {
  it.each([
    ['photo.webp', 'image/webp'],
    ['photo.png', 'image/png'],
    ['photo.jpg', 'image/jpeg'],
    ['photo.avif', 'image/avif'],
    ['cv.pdf', 'application/pdf'],
  ])('accepts %s (%s)', (name, type) => {
    expect(validateUpload({ name, type, size: 10 })).toBe(type);
  });

  it.each([
    ['logo.svg', 'image/svg+xml'],
    ['page.html', 'text/html'],
    ['script.js', 'text/javascript'],
    ['anim.gif', 'image/gif'],
    ['unknown', ''],
  ])('rejects %s (%s)', (name, type) => {
    expect(() => validateUpload({ name, type, size: 10 })).toThrow(UploadValidationError);
  });

  it('rejects a type outside the per-field allowlist', () => {
    expect(() =>
      validateUpload({ name: 'cv.png', type: 'image/png', size: 10 }, PDF_MIME_TYPES),
    ).toThrow(/not an allowed file type \(allowed: pdf\)/);
    expect(() =>
      validateUpload({ name: 'a.pdf', type: 'application/pdf', size: 10 }, IMAGE_MIME_TYPES),
    ).toThrow(UploadValidationError);
  });

  it('enforces the 5 MB limit and rejects empty files', () => {
    expect(validateUpload({ name: 'a.png', type: 'image/png', size: MAX_UPLOAD_BYTES })).toBe(
      'image/png',
    );
    expect(() =>
      validateUpload({ name: 'a.png', type: 'image/png', size: MAX_UPLOAD_BYTES + 1 }),
    ).toThrow(/too large \(max 5 MB\)/);
    expect(() => validateUpload({ name: 'a.png', type: 'image/png', size: 0 })).toThrow(/empty/);
  });
});

describe('buildUploadPath', () => {
  it('uses folder/<uuid>.<ext> and never the original name', () => {
    const path = buildUploadPath('projects', 'image/jpeg');
    expect(path).toMatch(new RegExp(`^projects/${UUID.source}\\.jpg$`));
    expect(buildUploadPath('cv', 'application/pdf')).toMatch(/^cv\/.+\.pdf$/);
  });

  it('appends _<w>x<h> when the image size is known', () => {
    expect(buildUploadPath('projects', 'image/webp', { width: 1600, height: 900 })).toMatch(
      new RegExp(`^projects/${UUID.source}_1600x900\\.webp$`),
    );
  });

  it('generates a new name every time', () => {
    expect(buildUploadPath('blogs', 'image/webp')).not.toBe(buildUploadPath('blogs', 'image/webp'));
  });
});

describe('acceptAttribute', () => {
  it('lists MIME types for the file input', () => {
    expect(acceptAttribute(PDF_MIME_TYPES)).toBe('application/pdf');
    expect(acceptAttribute()).toContain('image/webp');
    expect(acceptAttribute()).not.toContain('svg');
  });
});

describe('uploadFile', () => {
  it('uploads to the bucket under a UUID name and returns path + public URL', async () => {
    upload.mockImplementation((path) => Promise.resolve({ data: { path }, error: null }));
    getPublicUrl.mockImplementation((path) => ({
      data: { publicUrl: `https://cdn.test/${path}` },
    }));

    const result = await uploadFile(fakeFile('My Photo (1).PNG', 'image/png'), 'projects');

    expect(from).toHaveBeenCalledWith('ilramdhan.dev');
    const [path, , options] = upload.mock.calls[0]!;
    expect(path).toMatch(new RegExp(`^projects/${UUID.source}\\.png$`));
    expect(options).toMatchObject({ contentType: 'image/png', upsert: false });
    expect(result).toEqual({ path, publicUrl: `https://cdn.test/${path}` });
  });

  it('stores images as compressed WebP named with their dimensions', async () => {
    upload.mockImplementation((path) => Promise.resolve({ data: { path }, error: null }));
    getPublicUrl.mockImplementation((path) => ({
      data: { publicUrl: `https://cdn.test/${path}` },
    }));
    const webp = new Blob([new Uint8Array(300 * 1024)], { type: 'image/webp' });
    compressImage.mockResolvedValue({ blob: webp, width: 512, height: 384 });

    await uploadFile(fakeFile('me.jpg', 'image/jpeg', 4 * 1024 * 1024 - 1), 'avatars');

    expect(compressImage).toHaveBeenCalledWith(expect.any(File), 512);
    const [path, body, options] = upload.mock.calls[0]!;
    expect(path).toMatch(new RegExp(`^avatars/${UUID.source}_512x384\\.webp$`));
    expect(body).toBe(webp);
    expect(options).toMatchObject({ contentType: 'image/webp' });
  });

  it('uploads PDFs unchanged and never compresses them', async () => {
    upload.mockImplementation((path) => Promise.resolve({ data: { path }, error: null }));
    getPublicUrl.mockImplementation((path) => ({
      data: { publicUrl: `https://cdn.test/${path}` },
    }));
    const pdf = fakeFile('cv.pdf', 'application/pdf');
    await uploadFile(pdf, 'cv');
    expect(compressImage).not.toHaveBeenCalled();
    expect(upload.mock.calls[0]![1]).toBe(pdf);
    expect(upload.mock.calls[0]![0]).toMatch(/^cv\/[^_]+\.pdf$/);
  });

  it('does not call Storage for an invalid file', async () => {
    await expect(uploadFile(fakeFile('x.svg', 'image/svg+xml'), 'logos')).rejects.toThrow(
      UploadValidationError,
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it('surfaces Storage errors (e.g. the server-side MIME/size/RLS checks)', async () => {
    upload.mockResolvedValue({
      data: null,
      error: { message: 'new row violates row-level security policy' },
    });
    await expect(uploadFile(fakeFile('a.webp', 'image/webp'), 'blogs')).rejects.toThrow(
      /Upload failed for "a.webp": new row violates/,
    );
  });
});

describe('uploadAll', () => {
  it('uploads every file and returns the public URLs in order', async () => {
    upload.mockImplementation((path) => Promise.resolve({ data: { path }, error: null }));
    getPublicUrl.mockImplementation((path) => ({
      data: { publicUrl: `https://cdn.test/${path}` },
    }));
    const urls = await uploadAll([
      { file: fakeFile('a.png', 'image/png'), folder: 'projects', allowed: IMAGE_MIME_TYPES },
      { file: fakeFile('cv.pdf', 'application/pdf'), folder: 'cv', allowed: PDF_MIME_TYPES },
    ]);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toMatch(/^https:\/\/cdn\.test\/projects\/.+\.png$/);
    expect(urls[1]).toMatch(/^https:\/\/cdn\.test\/cv\/.+\.pdf$/);
  });

  it('uploads nothing when any file is invalid', async () => {
    await expect(
      uploadAll([
        { file: fakeFile('a.png', 'image/png'), folder: 'projects', allowed: IMAGE_MIME_TYPES },
        {
          file: fakeFile('b.pdf', 'application/pdf'),
          folder: 'projects',
          allowed: IMAGE_MIME_TYPES,
        },
      ]),
    ).rejects.toThrow(UploadValidationError);
    expect(upload).not.toHaveBeenCalled();
  });

  it('resolves to an empty list for no jobs', async () => {
    await expect(uploadAll([])).resolves.toEqual([]);
  });
});
