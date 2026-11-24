import { cloneElement, useId, type ReactElement } from 'react';

interface FieldProps {
  label: string;
  description?: string;
  error?: string | null;
  /** A single form control; receives `id`, `aria-describedby` and `aria-invalid`. */
  children: ReactElement<Record<string, unknown>>;
}

/** Label + control + description + error, wired together for assistive tech. */
export function Field({ label, description, error, children }: FieldProps) {
  const id = useId();
  const descId = description ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-caption font-semibold text-ink">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {description && (
        <p id={descId} className="text-caption text-ink-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
