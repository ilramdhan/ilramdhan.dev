import { ALL_MIME_TYPES, IMAGE_MIME_TYPES, uploadAll, type UploadJob } from '@/lib/upload';
import type { FormValues } from './useZodForm';
import type { FormSection, MediaFile, MediaList } from './fields';

/**
 * Uploads every file picked in `images`/`file` fields (validating all of them first) and
 * returns a copy of `values` where those fields point at the stored URLs, files cleared.
 */
export async function resolveUploads<V extends FormValues>(
  sections: readonly FormSection<V>[],
  values: V,
): Promise<V> {
  const out: Record<string, unknown> = { ...values };
  const jobs: UploadJob[] = [];
  const apply: ((urls: string[]) => void)[] = [];

  for (const field of sections.flatMap((s) => s.fields)) {
    const name = field.name as string;
    if (field.kind === 'images') {
      const media = out[name] as MediaList;
      const start = jobs.length;
      media.files.forEach((file) =>
        jobs.push({ file, folder: field.folder, allowed: IMAGE_MIME_TYPES }),
      );
      apply.push((urls) => {
        out[name] = {
          urls: [...media.urls, ...urls.slice(start, start + media.files.length)],
          files: [],
        };
      });
    } else if (field.kind === 'file') {
      const media = out[name] as MediaFile;
      if (!media.file) continue;
      const index = jobs.length;
      jobs.push({
        file: media.file,
        folder: field.folder,
        allowed: field.accept ?? ALL_MIME_TYPES,
      });
      apply.push((urls) => {
        out[name] = { url: urls[index]!, file: null };
      });
    }
  }

  if (jobs.length === 0) return values;
  const urls = await uploadAll(jobs);
  apply.forEach((fn) => fn(urls));
  return out as V;
}
