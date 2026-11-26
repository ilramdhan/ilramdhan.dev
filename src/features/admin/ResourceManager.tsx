import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import type { FormValues, ZodForm } from './useZodForm';
import { ResourceForm } from './ResourceForm';
import { idTranslation } from './translations';
import type { ResourceConfig, ResourceRow } from './resource';
import { confirmDiscard } from './unsaved';
import { useCrudResource } from './useCrudResource';

/** What one list row shows: a title, one muted line and an optional thumbnail. */
export interface RowView {
  title: string;
  meta?: string | null;
  image?: string | null;
}

interface ResourceManagerProps<Row extends ResourceRow, V extends FormValues, P extends object> {
  resource: ResourceConfig<Row, V, P>;
  heading: ReactNode;
  addLabel: string;
  /** Page title (h1) or a section of a page (h2). */
  variant?: 'page' | 'section';
  row: (row: Row) => RowView;
  formTitle?: (editing: Row | null) => string;
  extra?: (form: ZodForm<V>) => ReactNode;
  /** Thumbnails drawn as icons (contained, no crop). */
  iconThumbs?: boolean;
}

/**
 * One resource: header with "add", the inline create/edit form and the rows (a ruled list, no cards). Row actions are
 * always visible (touch) and Delete asks first.
 */
export function ResourceManager<Row extends ResourceRow, V extends FormValues, P extends object>({
  resource,
  heading,
  addLabel,
  variant = 'page',
  row,
  formTitle,
  extra,
  iconThumbs,
}: ResourceManagerProps<Row, V, P>) {
  const crud = useCrudResource(resource);
  // `undefined` = form closed, `null` = creating, a row = editing it.
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<{ id: number; title: string } | null>(null);
  const close = () => setEditing(undefined);
  const open = (next: Row | null) => {
    if (editing !== undefined && !confirmDiscard()) return;
    setEditing(next);
  };
  const Heading = variant === 'page' ? 'h1' : 'h2';

  return (
    <section className={variant === 'section' ? 'mt-section first:mt-0' : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading
          tabIndex={-1}
          className={`${variant === 'page' ? 'text-section' : 'text-title'} font-semibold text-ink outline-none`}
        >
          {heading}
        </Heading>
        <button type="button" onClick={() => open(null)} className="btn-primary">
          {addLabel}
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
          className="mt-8 space-y-6 border-y border-rule py-8"
          extra={extra}
          translatable={resource.translatable}
          defaultTranslation={idTranslation(
            (editing as { translations?: unknown } | null)?.translations,
          )}
          onCancel={close}
          onSubmit={(values, translation) =>
            crud.save.mutate({ values, editing, translation }, { onSuccess: close })
          }
        />
      )}

      {crud.list.isLoading ? (
        <p role="status" className="mt-6 text-body text-ink-muted">
          Loading...
        </p>
      ) : crud.list.data?.length ? (
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {crud.list.data.map((item) => {
            const view = row(item);
            return (
              <li key={item.id} className="flex items-center gap-4 py-3">
                {view.image !== undefined && (
                  <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-tile-frame">
                    {view.image && (
                      <img
                        src={view.image}
                        alt=""
                        className={iconThumbs ? 'size-7 object-contain' : 'size-full object-cover'}
                      />
                    )}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-ink">{view.title}</p>
                  {view.meta && <p className="truncate text-caption text-ink-muted">{view.meta}</p>}
                </div>
                <div className="flex shrink-0">
                  <button
                    type="button"
                    onClick={() => open(item)}
                    aria-label={`Edit ${view.title}`}
                    className="btn-text"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting({ id: item.id, title: view.title })}
                    aria-label={`Delete ${view.title}`}
                    className="btn-text-danger"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-body text-ink-muted">Nothing here yet. {addLabel} to start.</p>
      )}

      <ConfirmDialog
        title={deleting && `Delete “${deleting.title}”?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && crud.remove.mutate(deleting.id)}
      />
    </section>
  );
}
