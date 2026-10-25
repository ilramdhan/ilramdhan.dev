import { useState, type ReactNode } from 'react';
import type { ZodType } from 'zod';
import { Loader2, Save, Trash } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { acceptAttribute, ALL_MIME_TYPES, IMAGE_MIME_TYPES } from '@/lib/upload';
import { MarkdownField } from './MarkdownField';
import type { FieldConfig, FormSection, MediaFile, MediaList } from './fields';
import { useZodForm, type FormValues, type ZodForm } from './useZodForm';

const GRID: Record<1 | 2 | 3, string> = {
  1: 'space-y-4',
  2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
};

export interface ResourceFormProps<V extends FormValues> {
  title?: string;
  sections: FormSection<V>[];
  schema: ZodType<V, unknown>;
  defaultValues: V;
  onSubmit: (values: V) => unknown;
  onCancel?: () => void;
  isPending: boolean;
  submitLabel: string;
  className?: string;
  /** Extra content after the fields (e.g. a live preview). */
  extra?: (form: ZodForm<V>) => ReactNode;
}

/** Config-driven admin form: zod validation, errors shown inline under each field. */
export function ResourceForm<V extends FormValues>({
  title,
  sections,
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  className = 'form-container mb-6',
  extra,
}: ResourceFormProps<V>) {
  const form = useZodForm(schema, defaultValues);
  // In-content image uploads (MarkdownField) still running: saving or cancelling now
  // would drop the URL they are about to insert.
  const [uploads, setUploads] = useState(0);
  const onUploading = (active: boolean) => setUploads((n) => Math.max(0, n + (active ? 1 : -1)));
  const busy = isPending || uploads > 0;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className={className}>
      {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
      {sections.map((section, i) => (
        <div key={i} className="space-y-4">
          {section.divider && <hr className="border-slate-200 dark:border-white/10" />}
          {section.title && <h2 className="text-xl font-bold">{section.title}</h2>}
          <div className={GRID[section.columns ?? 1]}>
            {section.fields.map((field) => (
              <div key={field.name} className={field.wide ? 'md:col-span-full' : undefined}>
                <FormField field={field} form={form} onUploading={onUploading} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {extra?.(form)}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={busy} className="btn-primary">
          {isPending ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
        {/* Uploads are compressed in the browser first (T-27): say what's happening. */}
        <span role="status" aria-live="polite" className="sr-only">
          {isPending ? 'Compressing and uploading images, then saving…' : ''}
        </span>
      </div>
    </form>
  );
}

function FormField<V extends FormValues>({
  field,
  form,
  onUploading,
}: {
  field: FieldConfig<V>;
  form: ZodForm<V>;
  onUploading: (active: boolean) => void;
}) {
  const name = field.name as string;
  const value = form.get(name);
  const set = (next: unknown) => form.set(name, next);
  const common = { label: field.label, description: field.description, error: form.errors[name] };
  const placeholder = field.placeholder ?? field.label;
  const text = {
    name,
    value: (value as string | undefined) ?? '',
    onChange: (e: { target: { value: string } }) => set(e.target.value),
    className: 'input',
  };

  switch (field.kind) {
    case 'text':
    case 'url':
    case 'email':
    case 'tags':
      return (
        <Field {...common}>
          <input
            {...text}
            type={field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'}
            inputMode={field.kind === 'url' ? 'url' : undefined}
            placeholder={placeholder}
          />
        </Field>
      );
    case 'date':
      return (
        <Field {...common}>
          <input {...text} type="date" />
        </Field>
      );
    case 'markdown':
      if (field.folder)
        return (
          <MarkdownField
            {...common}
            text={text}
            folder={field.folder}
            placeholder={placeholder}
            rows={field.rows ?? 3}
            onValue={set}
            onUploading={onUploading}
          />
        );
      return (
        <Field {...common}>
          <textarea {...text} placeholder={placeholder} rows={field.rows ?? 3} />
        </Field>
      );
    case 'textarea':
      return (
        <Field {...common}>
          <textarea {...text} placeholder={placeholder} rows={field.rows ?? 3} />
        </Field>
      );
    case 'select':
      return (
        <Field {...common}>
          <select {...text}>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name={name}
            checked={!!value}
            onChange={(e) => set(e.target.checked)}
          />{' '}
          {field.label}
        </label>
      );
    case 'images': {
      const media = value as MediaList;
      return (
        <div>
          {media.urls.length > 0 && (
            <ul className="flex flex-wrap gap-2 mb-2" aria-label={`Current ${field.label}`}>
              {media.urls.map((url) => (
                <li key={url} className="relative">
                  <img
                    src={url}
                    alt={`${field.label} ${media.urls.indexOf(url) + 1}`}
                    className="h-16 w-16 object-cover rounded"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => set({ ...media, urls: media.urls.filter((u) => u !== url) })}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Field
            {...common}
            description={
              common.description ??
              'Converted to WebP (max 1600 px) in your browser before upload. Max 5 MB each.'
            }
          >
            <input
              type="file"
              multiple
              accept={acceptAttribute(IMAGE_MIME_TYPES)}
              onChange={(e) => set({ ...media, files: Array.from(e.target.files ?? []) })}
              className="input-file"
            />
          </Field>
        </div>
      );
    }
    case 'file': {
      const media = value as MediaFile;
      return (
        <div>
          <Field {...common}>
            <input
              type="file"
              accept={acceptAttribute(field.accept ?? ALL_MIME_TYPES)}
              onChange={(e) => set({ ...media, file: e.target.files?.[0] ?? null })}
              className="input-file"
            />
          </Field>
          {media.url && <FilePreview url={media.url} field={field} />}
        </div>
      );
    }
  }
}

function FilePreview<V extends FormValues>({
  url,
  field,
}: {
  url: string;
  field: Extract<FieldConfig<V>, { kind: 'file' }>;
}) {
  if (field.preview === 'avatar')
    return <img src={url} alt="" className="h-12 w-12 rounded-full object-cover mt-2" />;
  if (field.preview === 'image')
    return <img src={url} alt="" className="h-8 w-auto object-contain mt-2" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 mt-1 block">
      {field.linkLabel ?? 'Current File'}
    </a>
  );
}
