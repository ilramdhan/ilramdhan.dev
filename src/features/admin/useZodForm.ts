import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ZodType } from 'zod';

/** Object values only; nested objects are addressed with dotted paths ("social_links.github"). */
export type FormValues = Record<string, unknown>;
export type FormErrors = Record<string, string>;

export function getPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((o, key) => (o as Record<string, unknown> | null)?.[key], obj);
}

export function setPath<V extends FormValues>(obj: V, path: string, value: unknown): V {
  const [head, ...rest] = path.split('.') as [string, ...string[]];
  const next = rest.length
    ? setPath((obj[head] ?? {}) as FormValues, rest.join('.'), value)
    : value;
  return { ...obj, [head]: next };
}

export interface ZodForm<V extends FormValues> {
  values: V;
  errors: FormErrors;
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  /** Validates with the schema; calls `onValid` with the parsed values or shows the errors. */
  handleSubmit: (onValid: (values: V) => unknown) => (e: FormEvent) => void;
}

/**
 * Minimal form state for the admin forms: controlled values, zod validation on submit
 * (then live, per field, once a field has an error) and the first error message per path.
 * Small on purpose — the admin bundle only needs this much.
 */
export function useZodForm<V extends FormValues>(
  schema: ZodType<V, unknown>,
  defaultValues: V,
): ZodForm<V> {
  const [values, setValues] = useState<V>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (candidate: V) => {
    const result = schema.safeParse(candidate);
    const found: FormErrors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        found[key] ??= issue.message;
      }
    }
    return { result, found };
  };

  return {
    values,
    errors,
    get: (path) => getPath(values, path),
    set: (path, value) => {
      const next = setPath(values, path, value);
      setValues(next);
      // Re-check only once the field shows an error, so typing clears it immediately.
      if (errors[path]) {
        const { found } = validate(next);
        setErrors((prev) => {
          const copy = { ...prev };
          if (found[path]) copy[path] = found[path];
          else delete copy[path];
          return copy;
        });
      }
    },
    handleSubmit: (onValid) => (e) => {
      e.preventDefault();
      const { result, found } = validate(values);
      setErrors(found);
      if (result.success) onValid(result.data);
    },
  };
}
