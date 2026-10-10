import { z } from 'zod';
import { ensureFullUrl } from '@/lib/utils';
import type { AllowedMimeType, UploadFolder } from '@/lib/upload';
import type { FormValues } from './useZodForm';

/** Images already stored (`urls`) plus files picked in the form, uploaded on submit. */
export interface MediaList {
  urls: string[];
  files: File[];
}
/** One stored file (`url`, '' when none) plus an optional replacement picked in the form. */
export interface MediaFile {
  url: string;
  file: File | null;
}

/** Top-level keys of V plus `key.sub` for nested plain objects (e.g. social links). */
export type FieldPath<V> = {
  [K in keyof V & string]: V[K] extends MediaList | MediaFile | readonly unknown[]
    ? K
    : V[K] extends Record<string, unknown>
      ? K | `${K}.${keyof V[K] & string}`
      : K;
}[keyof V & string];

interface BaseField<V extends FormValues> {
  name: FieldPath<V>;
  label: string;
  placeholder?: string;
  description?: string;
  /** Span the full row in a multi-column section. */
  wide?: boolean;
}

export type FieldConfig<V extends FormValues> = BaseField<V> &
  (
    | { kind: 'text' | 'url' | 'email' | 'date' | 'tags' }
    | { kind: 'textarea' | 'markdown'; rows?: number }
    | { kind: 'boolean' }
    | { kind: 'select'; options: readonly string[] }
    /** Value: `MediaList`. New files go to `folder` (images only). Top-level names only. */
    | { kind: 'images'; folder: UploadFolder }
    /** Value: `MediaFile`. Top-level names only. */
    | {
        kind: 'file';
        folder: UploadFolder;
        accept?: readonly AllowedMimeType[];
        preview: 'link' | 'image' | 'avatar';
        linkLabel?: string;
      }
  );

export interface FormSection<V extends FormValues> {
  title?: string;
  columns?: 1 | 2 | 3;
  /** Horizontal rule above the section. */
  divider?: boolean;
  fields: FieldConfig<V>[];
}

// ---- zod building blocks for resource schemas -------------------------------------------

export const requiredText = (max = 200) =>
  z.string().trim().min(1, 'Required').max(max, `At most ${max} characters`);
export const optionalText = (max = 200) => z.string().max(max, `At most ${max} characters`);
export const markdownText = (max = 100_000) => optionalText(max);

/** Accepts '' or a URL; a missing scheme is fine (`ensureFullUrl` adds https://). */
export function isUrlLike(value: string): boolean {
  if (value.trim() === '') return true;
  try {
    const url = new URL(ensureFullUrl(value.trim())!);
    return /^https?:$/.test(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
}
export const optionalUrl = z
  .string()
  .max(2048, 'At most 2048 characters')
  .refine(isUrlLike, 'Enter a valid URL');
export const optionalEmail = z
  .string()
  .trim()
  .max(320, 'At most 320 characters')
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address');
export const optionalDate = z
  .string()
  .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Enter a valid date');
export const tagsText = optionalText(1000);

export const mediaList = z.object({
  urls: z.array(z.string()),
  files: z.array(z.instanceof(File)),
});
export const mediaFile = z.object({ url: z.string(), file: z.instanceof(File).nullable() });

// ---- row <-> form value conversions -----------------------------------------------------

export const splitTags = (value: string) =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
export const joinTags = (tags: readonly string[] | null | undefined) => (tags ?? []).join(', ');
export const toMediaList = (urls: readonly string[] | null | undefined): MediaList => ({
  urls: [...(urls ?? [])],
  files: [],
});
export const toMediaFile = (url: string | null | undefined): MediaFile => ({
  url: url ?? '',
  file: null,
});
/** '' -> null for nullable columns (dates, optional URLs). */
export const orNull = (value: string) => (value.trim() === '' ? null : value);
export const urlOrNull = (value: string) => ensureFullUrl(value.trim()) ?? null;
