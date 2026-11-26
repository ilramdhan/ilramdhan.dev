import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/features/messages/api';
import { messageKeys, messageQueries } from '@/features/messages/queries';
import { ConfirmDialog } from '@/features/admin/ConfirmDialog';
import { cn } from '@/lib/utils';

const ADMIN_ITEMS_PER_PAGE = 10;
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export function MessagesTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  // What the confirm dialog will delete: one message or the selection.
  const [deleting, setDeleting] = useState<{ ids: number[]; title: string; bulk?: boolean } | null>(
    null,
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: messageKeys.all });

  const { data: messages, isLoading, isError, refetch } = useQuery(messageQueries.list());

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteMessage(id),
    onSuccess: () => {
      void refresh();
      toast.info('Message deleted.');
    },
    onError: (e) => toast.error(`Couldn't delete the message: ${errorText(e)}`),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markMessageAsRead(id),
    onSuccess: () => void refresh(),
    onError: (e) => toast.error(`Couldn't mark the message as read: ${errorText(e)}`),
  });

  const markAllReadMutation = useMutation({
    mutationFn: api.markAllMessagesAsRead,
    onSuccess: () => {
      void refresh();
      toast.success('All messages marked as read.');
    },
    onError: (e) => toast.error(`Couldn't mark messages as read: ${errorText(e)}`),
  });

  const list = messages ?? [];
  const totalPages = Math.ceil(list.length / ADMIN_ITEMS_PER_PAGE);
  const paginated = list.slice((page - 1) * ADMIN_ITEMS_PER_PAGE, page * ADMIN_ITEMS_PER_PAGE);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  // One by one, in selection order; a failure keeps the messages that are left selected (F12 B5).
  const bulkDelete = async (ids: number[]) => {
    const failed: number[] = [];
    for (const id of ids) {
      try {
        await api.deleteMessage(id);
      } catch {
        failed.push(id);
      }
    }
    void refresh();
    setSelected(failed);
    if (failed.length === 0) toast.success('Messages deleted.');
    else toast.error(`${failed.length} of ${ids.length} messages couldn't be deleted. Try again.`);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 tabIndex={-1} className="text-section font-semibold text-ink outline-none">
          Inbox ({list.length})
        </h1>
        <div className="flex flex-wrap gap-3">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setDeleting({
                  ids: selected,
                  title: `Delete ${selected.length} messages?`,
                  bulk: true,
                })
              }
              className="btn-secondary text-danger"
            >
              Delete Selected ({selected.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="btn-secondary"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {isLoading ? (
        <p role="status" className="mt-6 text-body text-ink-muted">
          Loading messages...
        </p>
      ) : isError ? (
        <p role="alert" className="mt-6 text-body text-danger">
          Couldn&apos;t load messages.{' '}
          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-11 text-action underline"
          >
            Try again
          </button>
        </p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-body text-ink-muted">No messages received yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {paginated.map((msg) => (
            <li key={msg.id} className="flex gap-3 py-4">
              <label className="-ml-3 grid size-11 shrink-0 cursor-pointer place-items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(msg.id)}
                  onChange={() => toggle(msg.id)}
                  aria-label={`Select message from ${msg.name}`}
                  className="size-5 accent-(--action)"
                />
              </label>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-4">
                  <div className="min-w-0 max-sm:basis-full sm:flex-1">
                    <p className="flex items-center gap-2 text-body text-ink">
                      {!msg.is_read && (
                        <span className="size-2 shrink-0 rounded-full bg-action">
                          <span className="sr-only">Unread:</span>
                        </span>
                      )}
                      <span className={cn('truncate', !msg.is_read && 'font-semibold')}>
                        {msg.name}
                      </span>
                    </p>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-caption break-all text-action underline-offset-4 hover:underline"
                    >
                      {msg.email}
                    </a>
                  </div>
                  <time dateTime={msg.created_at} className="text-caption text-ink-muted tabular">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </time>
                  <div className="flex">
                    {!msg.is_read && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(msg.id)}
                        className="btn-text"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setDeleting({
                          ids: [msg.id],
                          title: `Delete the message from ${msg.name}?`,
                        })
                      }
                      className="btn-text-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-body whitespace-pre-wrap text-ink-muted">{msg.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="grid size-11 place-items-center rounded-full text-action hover:bg-parchment disabled:text-ink-muted disabled:hover:bg-transparent"
          >
            <Arrow d="m15 18-6-6 6-6" />
          </button>
          <span className="text-caption text-ink-muted tabular">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="grid size-11 place-items-center rounded-full text-action hover:bg-parchment disabled:text-ink-muted disabled:hover:bg-transparent"
          >
            <Arrow d="m9 18 6-6-6-6" />
          </button>
        </nav>
      )}

      <ConfirmDialog
        title={deleting?.title ?? null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          if (deleting.bulk) void bulkDelete(deleting.ids);
          else deleteMutation.mutate(deleting.ids[0]!);
        }}
      />
    </>
  );
}

// Drawn here, not via StrokeIcon: sharing it with admin splits it out of the listing routes' chunk (+0.2 KiB there).
function Arrow({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
    >
      <path d={d} />
    </svg>
  );
}
