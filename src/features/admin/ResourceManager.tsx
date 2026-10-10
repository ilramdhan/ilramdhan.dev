import { useState, type ReactNode } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import type { FormValues, ZodForm } from './useZodForm';
import { ResourceForm } from './ResourceForm';
import type { ResourceConfig, ResourceRow } from './resource';
import { useCrudResource } from './useCrudResource';

export interface RowActions {
  edit: () => void;
  remove: () => void;
}

interface ResourceManagerProps<Row extends ResourceRow, V extends FormValues, P extends object> {
  resource: ResourceConfig<Row, V, P>;
  heading: ReactNode;
  addLabel: string;
  /** Size of the header + "add" button (page title vs. section title). */
  variant?: 'page' | 'section';
  /** Class of the element wrapping the rows. */
  listClassName: string;
  renderRow: (row: Row, actions: RowActions) => ReactNode;
  formClassName?: string;
  formTitle?: (editing: Row | null) => string;
  extra?: (form: ZodForm<V>) => ReactNode;
  /** Wraps the whole manager (default: nothing). */
  className?: string;
  addButtonClassName?: string;
}

/** Header with "add" button, inline create/edit form and the list of rows of one resource. */
export function ResourceManager<Row extends ResourceRow, V extends FormValues, P extends object>({
  resource,
  heading,
  addLabel,
  variant = 'page',
  listClassName,
  renderRow,
  formClassName,
  formTitle,
  extra,
  className,
  addButtonClassName = 'btn-primary-sm',
}: ResourceManagerProps<Row, V, P>) {
  const crud = useCrudResource(resource);
  // `undefined` = form closed, `null` = creating, a row = editing it.
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const close = () => setEditing(undefined);

  if (crud.list.isLoading) return <div>Loading...</div>;

  return (
    <div className={className}>
      <div className={`flex justify-between items-center ${variant === 'page' ? 'mb-6' : 'mb-4'}`}>
        {variant === 'page' ? (
          <h1 className="text-2xl font-bold">{heading}</h1>
        ) : (
          <h2 className="text-xl font-semibold">{heading}</h2>
        )}
        <button onClick={() => setEditing(null)} className={addButtonClassName}>
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      </div>

      {editing !== undefined && (
        <ResourceForm<V>
          key={editing?.id ?? 'new'}
          title={formTitle ? formTitle(editing) : `${editing ? 'Edit' : 'New'} ${resource.label}`}
          sections={resource.sections}
          schema={resource.schema}
          defaultValues={editing ? resource.toValues(editing) : resource.empty()}
          isPending={crud.isPending}
          submitLabel={editing ? 'Update' : 'Save'}
          className={formClassName}
          extra={extra}
          onCancel={close}
          onSubmit={(values) => crud.save.mutate({ values, editing }, { onSuccess: close })}
        />
      )}

      <div className={listClassName}>
        {crud.list.data?.map((row) =>
          renderRow(row, {
            edit: () => setEditing(row),
            remove: () => crud.remove.mutate(row.id),
          }),
        )}
      </div>
    </div>
  );
}

/** Edit + delete buttons shown on each row. */
export function RowButtons({
  actions,
  label,
  className = 'flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity',
  iconClassName = 'h-4 w-4',
}: {
  actions: RowActions;
  label: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={className}>
      <button onClick={actions.edit} aria-label={`Edit ${label}`} className="btn-icon-blue">
        <Edit className={iconClassName} />
      </button>
      <button onClick={actions.remove} aria-label={`Delete ${label}`} className="btn-icon-red">
        <Trash2 className={iconClassName} />
      </button>
    </div>
  );
}
