import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FormValues } from './useZodForm';
import { changedFields } from './diff';
import type { ResourceConfig, ResourceRow } from './resource';
import { resolveUploads } from './uploads';

export interface SaveInput<Row, V> {
  values: V;
  /** The row being edited, or null to create a new one. */
  editing: Row | null;
}

/**
 * Generic list + create/update/delete for an admin resource: uploads picked files, sends
 * only changed fields on update, removes deleted rows from the cached list right away,
 * shows toasts and refetches afterwards.
 */
export function useCrudResource<Row extends ResourceRow, V extends FormValues, P extends object>(
  resource: ResourceConfig<Row, V, P>,
) {
  const queryClient = useQueryClient();
  const { listKey } = resource;
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: resource.invalidate ?? listKey });
  const onError = (error: Error) => {
    toast.error(error.message);
  };

  const list = useQuery({ queryKey: listKey, queryFn: resource.fetchList });

  /** Resolves to false when an edit changed nothing (then no request is sent). */
  const save = useMutation({
    mutationFn: async ({ values, editing }: SaveInput<Row, V>): Promise<boolean> => {
      const uploaded = await resolveUploads(resource.sections, values);
      const payload = resource.toPayload(uploaded, editing);
      if (!editing) {
        await resource.api.create(payload);
        return true;
      }
      const patch = changedFields(payload, editing as unknown as Partial<P>);
      if (Object.keys(patch).length === 0) return false;
      await resource.api.update({ ...patch, id: editing.id });
      return true;
    },
    // An edit without changes sends no request but still reads as a save to the admin.
    onSuccess: (_changed, { editing }) => {
      void invalidate();
      toast.success(`${resource.label} ${editing ? 'updated' : 'added'}!`);
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => resource.api.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Row[]>(listKey);
      queryClient.setQueryData<Row[]>(listKey, (rows) => rows?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
      onError(error);
    },
    onSuccess: () => {
      toast.info(`${resource.label} removed.`);
    },
    onSettled: () => {
      void invalidate();
    },
  });

  return {
    list,
    save,
    create: (values: V) => save.mutateAsync({ values, editing: null }),
    update: (row: Row, values: V) => save.mutateAsync({ values, editing: row }),
    remove,
    isPending: save.isPending,
  };
}
