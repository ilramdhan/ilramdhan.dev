import {
  useId,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { ZodType } from 'zod';
import { Field } from '@/components/ui/Field';
import { acceptAttribute, ALL_MIME_TYPES, IMAGE_MIME_TYPES } from '@/lib/upload';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { cleanTranslation, type Translation } from './translations';
import { MarkdownField, Spinner } from './MarkdownField';
import { useUnsavedGuard } from './unsaved';
import type { FieldConfig, FormSection, MediaFile, MediaList } from './fields';
import { useZodForm, type FormValues, type ZodForm } from './useZodForm';

const GRID: Record<1 | 2 | 3, string> = {
  1: 'flex flex-col gap-6',
  2: 'grid grid-cols-1 gap-6 md:grid-cols-2',
  3: 'grid grid-cols-1 gap-6 md:grid-cols-3',
};

export interface ResourceFormProps<V extends FormValues> {
  title?: string;
  sections: FormSection<V>[];
  schema: ZodType<V, unknown>;
  defaultValues: V;
  /** `translation`: the non-empty Indonesian texts (only when `translatable` is set). */
  onSubmit: (values: V, translation: Translation) => unknown;
  /** Names of the fields that also get an ID text (EN | ID tabs); written to `translations.id`. */
  translatable?: readonly string[];
  /** Current `translations.id` of the row being edited. */
  defaultTranslation?: Translation;
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
  className = 'space-y-6',
  extra,
  translatable,
  defaultTranslation,
}: ResourceFormProps<V>) {
  const form = useZodForm(schema, defaultValues);
  const [tab, setTab] = useState<'en' | 'id'>('en');
  const [translation, setTranslation] = useState<Translation>(defaultTranslation ?? {});
  // In-content image uploads (MarkdownField) still running: saving or cancelling now
  // would drop the URL they are about to insert.
  const [uploads, setUploads] = useState(0);
  const onUploading = (active: boolean) => setUploads((n) => Math.max(0, n + (active ? 1 : -1)));
  const busy = isPending || uploads > 0;
  // Unsaved edits (EN fields, files or ID texts) arm the leave guard.
  useUnsavedGuard(
    JSON.stringify(form.values) !== JSON.stringify(defaultValues) ||
      JSON.stringify(cleanTranslation(translation)) !==
        JSON.stringify(cleanTranslation(defaultTranslation ?? {})),
  );
  const t = useT();
  const uid = useId();
  const ids = {
    tab: { en: `${uid}-tab-en`, id: `${uid}-tab-id` },
    panel: { en: `${uid}-panel-en`, id: `${uid}-panel-id` },
  };
  // Errors live in the EN panel: reveal it and focus the first invalid field.
  const onInvalid = (errors: Record<string, string>, root: HTMLFormElement) => {
    setTab('en');
    const first = Object.keys(errors)[0];
    setTimeout(() => {
      const el = first ? root.elements.namedItem(first) : null;
      if (el instanceof HTMLElement) el.focus();
    });
  };

  return (
    <form
      noValidate
      onSubmit={(e) =>
        form.handleSubmit(
          (values) => onSubmit(values, cleanTranslation(translation)),
          (errors) => onInvalid(errors, e.currentTarget),
        )(e)
      }
      className={className}
    >
      {title && <h2 className="text-title font-semibold text-ink">{title}</h2>}
      {translatable && translatable.length > 0 && <LangTabs tab={tab} onTab={setTab} ids={ids} />}
      {tab === 'id' && translatable && (
        <div
          id={ids.panel.id}
          role="tabpanel"
          aria-labelledby={ids.tab.id}
          className="flex flex-col gap-6"
        >
          <p className="text-caption text-ink-muted">{t.admin.translationHint}</p>
          {sections
            .flatMap((section) => section.fields)
            .filter((field) => translatable.includes(field.name as string))
            .map((field) => (
              <FormField
                key={field.name}
                field={field}
                form={translationForm(translation, setTranslation)}
                onUploading={onUploading}
              />
            ))}
        </div>
      )}
      <div
        hidden={tab === 'id'}
        id={ids.panel.en}
        role={translatable ? 'tabpanel' : undefined}
        aria-labelledby={translatable ? ids.tab.en : undefined}
        className="space-y-8"
      >
        {sections.map((section, i) => (
          <div key={i} className="space-y-6">
            {section.divider && <hr className="border-rule" />}
            {section.title && (
              <h3 className="text-title font-semibold text-ink">{section.title}</h3>
            )}
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
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={busy} className="btn-primary">
          {isPending && <Spinner />}
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

/** A form-shaped view of the ID texts, so the regular field renderer can edit them. */
function translationForm<V extends FormValues>(
  translation: Translation,
  set: Dispatch<SetStateAction<Translation>>,
): ZodForm<V> {
  return {
    values: translation as unknown as V,
    errors: {},
    get: (path) => translation[path],
    set: (path, value) =>
      set((prev) => ({ ...prev, [path]: typeof value === 'string' ? value : '' })),
    handleSubmit: () => () => undefined,
  };
}

/** EN | ID switch: WAI-ARIA tabs with roving focus (arrows, Home, End). */
type Lang = 'en' | 'id';
function LangTabs({
  tab,
  onTab,
  ids,
}: {
  tab: Lang;
  onTab: (tab: Lang) => void;
  ids: { tab: Record<Lang, string>; panel: Record<Lang, string> };
}) {
  const t = useT();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const group = useId();
  const order = ['en', 'id'] as const;
  const move = (e: KeyboardEvent, from: number) => {
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (from + 1) % order.length
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (from + order.length - 1) % order.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? order.length - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    const target = order[next]!;
    onTab(target);
    refs.current[target]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={t.admin.tabsLabel}
      id={group}
      className="inline-grid grid-cols-2 rounded-full bg-parchment p-1"
    >
      {order.map((lang, i) => (
        <button
          key={lang}
          ref={(el) => {
            refs.current[lang] = el;
          }}
          type="button"
          role="tab"
          id={ids.tab[lang]}
          aria-selected={tab === lang}
          aria-controls={ids.panel[lang]}
          tabIndex={tab === lang ? 0 : -1}
          onClick={() => onTab(lang)}
          onKeyDown={(e) => move(e, i)}
          className={cn(
            'inline-flex min-h-11 min-w-16 items-center justify-center rounded-full px-4 text-caption transition-colors duration-200',
            tab === lang ? 'bg-thumb font-semibold text-ink' : 'text-ink-muted hover:text-ink',
          )}
        >
          {lang === 'en' ? t.admin.tabEn : t.admin.tabId}
        </button>
      ))}
    </div>
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
        <label className="inline-flex min-h-11 items-center gap-3 text-body text-ink">
          <input
            type="checkbox"
            name={name}
            checked={!!value}
            onChange={(e) => set(e.target.checked)}
            className="size-5 accent-(--action)"
          />
          {field.label}
        </label>
      );
    case 'images': {
      const media = value as MediaList;
      return (
        <div>
          {media.urls.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-3" aria-label={`Current ${field.label}`}>
              {media.urls.map((url) => (
                <li key={url} className="relative">
                  <img
                    src={url}
                    alt={`${field.label} ${media.urls.indexOf(url) + 1}`}
                    className="size-20 rounded-sm bg-tile-frame object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => set({ ...media, urls: media.urls.filter((u) => u !== url) })}
                    className="absolute -top-3 -right-3 grid size-11 place-items-center rounded-full"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-ink text-white">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 18 18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="size-3"
                      >
                        <path d="m4 4 10 10M14 4 4 14" />
                      </svg>
                    </span>
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
    return <img src={url} alt="" className="mt-3 size-12 rounded-full object-cover" />;
  if (field.preview === 'image')
    return <img src={url} alt="" className="mt-3 h-8 w-auto object-contain" />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-flex min-h-11 items-center text-caption text-action underline-offset-4 hover:underline"
    >
      {field.linkLabel ?? 'Current File'}
    </a>
  );
}
