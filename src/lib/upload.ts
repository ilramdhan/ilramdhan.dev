import { getSupabase } from '@/lib/supabase/lazy';
import { compressImage, DEFAULT_MAX_IMAGE_EDGE, MAX_IMAGE_EDGE } from '@/lib/image-compress';

/**
 * Admin uploads to the public "ilramdhan.dev" bucket (T-09).
 *
 * The bucket itself enforces the same MIME allowlist and size limit and only lets
 * admins write into these folders (migration 20261010100000_admin_allowlist.sql);
 * the checks here just fail fast with a readable message.
 */
export const UPLOAD_BUCKET = 'ilramdhan.dev';

export const UPLOAD_FOLDERS = [
  'projects',
  'blogs',
  'certificates',
  'avatars',
  'logos',
  'cv',
] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** MIME type -> file extension used for the stored object. */
export const ALLOWED_MIME_TYPES = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
} as const;
export type AllowedMimeType = keyof typeof ALLOWED_MIME_TYPES;

export const IMAGE_MIME_TYPES: readonly AllowedMimeType[] = [
  'image/webp',
  'image/png',
  'image/jpeg',
  'image/avif',
];
export const PDF_MIME_TYPES: readonly AllowedMimeType[] = ['application/pdf'];
export const ALL_MIME_TYPES = Object.keys(ALLOWED_MIME_TYPES) as AllowedMimeType[];

/** 5 MB, same as the bucket's `file_size_limit`. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Value for an `<input type="file" accept>` attribute. */
export const acceptAttribute = (types: readonly AllowedMimeType[] = ALL_MIME_TYPES) =>
  types.join(',');

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadValidationError';
  }
}

const isAllowedMime = (type: string): type is AllowedMimeType =>
  Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TYPES, type);

/** Throws `UploadValidationError` when the file type or size is not accepted. */
export function validateUpload(
  file: Pick<File, 'name' | 'type' | 'size'>,
  allowed: readonly AllowedMimeType[] = ALL_MIME_TYPES,
): AllowedMimeType {
  if (!isAllowedMime(file.type) || !allowed.includes(file.type)) {
    const exts = allowed.map((t) => ALLOWED_MIME_TYPES[t]).join(', ');
    throw new UploadValidationError(
      `"${file.name}" is not an allowed file type (allowed: ${exts}).`,
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError(
      `"${file.name}" is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`,
    );
  }
  if (file.size === 0) {
    throw new UploadValidationError(`"${file.name}" is empty.`);
  }
  return file.type;
}

/**
 * `folder/<uuid>.<ext>`: never uses the original (user-controlled) file name. Images whose
 * size is known get `_<w>x<h>` (`folder/<uuid>_1600x900.webp`) so pages can reserve their
 * box without a database column (T-27).
 */
export function buildUploadPath(
  folder: UploadFolder,
  mime: AllowedMimeType,
  size?: { width: number; height: number },
): string {
  const dims = size ? `_${size.width}x${size.height}` : '';
  return `${folder}/${crypto.randomUUID()}${dims}.${ALLOWED_MIME_TYPES[mime]}`;
}

/**
 * Images are resized (1600 px; avatars 512, logos 256) and re-encoded as WebP before
 * upload; PDFs and images the browser can't convert are uploaded unchanged.
 */
async function prepareUpload(
  file: File,
  folder: UploadFolder,
  mime: AllowedMimeType,
): Promise<{ body: Blob; mime: AllowedMimeType; size?: { width: number; height: number } }> {
  if (!IMAGE_MIME_TYPES.includes(mime)) return { body: file, mime };
  const compressed = await compressImage(file, MAX_IMAGE_EDGE[folder] ?? DEFAULT_MAX_IMAGE_EDGE);
  if (!compressed) return { body: file, mime };
  const { blob, width, height } = compressed;
  return { body: blob, mime: 'image/webp', size: { width, height } };
}

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/** Validates, compresses (images) and uploads one file, returning its path and public URL. */
export async function uploadFile(
  file: File,
  folder: UploadFolder,
  allowed: readonly AllowedMimeType[] = ALL_MIME_TYPES,
): Promise<UploadResult> {
  const supabase = await getSupabase();
  const original = validateUpload(file, allowed);
  const { body, mime, size } = await prepareUpload(file, folder, original);
  const bucket = supabase.storage.from(UPLOAD_BUCKET);
  const { data, error } = await bucket.upload(buildUploadPath(folder, mime, size), body, {
    cacheControl: '3600',
    contentType: mime,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed for "${file.name}": ${error.message}`);
  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(data.path);
  return { path: data.path, publicUrl };
}

export interface UploadJob {
  file: File;
  folder: UploadFolder;
  allowed?: readonly AllowedMimeType[];
}

/**
 * Uploads several files, validating all of them first so one bad file doesn't leave
 * the others orphaned in Storage. Returns the public URLs in job order.
 */
export async function uploadAll(jobs: readonly UploadJob[]): Promise<string[]> {
  jobs.forEach(({ file, allowed }) => validateUpload(file, allowed));
  const results = await Promise.all(
    jobs.map(({ file, folder, allowed }) => uploadFile(file, folder, allowed)),
  );
  return results.map((r) => r.publicUrl);
}
