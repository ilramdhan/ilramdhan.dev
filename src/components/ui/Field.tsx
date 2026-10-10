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
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {description && (
        <p id={descId} className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
