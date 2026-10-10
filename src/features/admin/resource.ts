import type { QueryKey } from '@tanstack/react-query';
import type { ZodType, ZodTypeDef } from 'zod';
import type { FormValues } from './useZodForm';
import type { FormSection } from './fields';

export interface ResourceRow {
  id: number;
}

/**
 * Everything the generic admin CRUD needs to know about one table (PLAN §4.6):
 * how to list/create/update/delete it, its form (zod schema + field config), and how
 * rows map to form values and form values back to a database payload.
 */
export interface ResourceConfig<
  Row extends ResourceRow,
  V extends FormValues,
  Payload extends object,
> {
  /** Singular label used in headings and toasts ("Project" -> "Project added!"). */
  label: string;
  /** Cache key of the list (shown, optimistically updated on delete, refetched). */
  listKey: QueryKey;
  /** Loads the rows shown in the admin list. */
  fetchList: () => Promise<Row[]>;
  /** Invalidated after every successful mutation (defaults to the list key). */
  invalidate?: QueryKey;
  api: {
    create: (payload: Payload) => Promise<unknown>;
    update: (patch: Partial<Payload> & { id: number }) => Promise<unknown>;
    remove: (id: number) => Promise<void>;
  };
  schema: ZodType<V, ZodTypeDef, unknown>;
  sections: FormSection<V>[];
  /** Form values for a new row. */
  empty: () => V;
  toValues: (row: Row) => V;
  /** Database payload from (validated, uploaded) form values; `row` is set when editing. */
  toPayload: (values: V, row: Row | null) => Payload;
}

/** Identity helper that infers the generics of a resource config. */
export function defineResource<
  Row extends ResourceRow,
  V extends FormValues,
  Payload extends object,
>(config: ResourceConfig<Row, V, Payload>): ResourceConfig<Row, V, Payload> {
  return config;
}
