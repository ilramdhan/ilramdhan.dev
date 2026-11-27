import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/features/blog/api';
import { blogKeys, blogQueries } from '@/features/blog/queries';
import { ConfirmDialog } from '@/features/admin/ConfirmDialog';

const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

/** Moderation queue: comments arrive unapproved (api/comment.ts) and show on the post once approved. */
// ponytail: no pagination; add it (like MessagesTab) if the queue ever grows past a screen or two.
export function CommentsTab() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<api.AdminComment | null>(null);
  // Also refreshes the public per-post lists (same 'comments' key prefix).
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...blogKeys.all, 'comments'] });

  const { data, isLoading, isError, refetch } = useQuery(blogQueries.adminComments());
  const list = data ?? [];
  const pending = list.filter((c) => !c.approved).length;

  const approve = useMutation({
    mutationFn: api.approveComment,
    onSuccess: () => {
      void refresh();
      toast.success('Comment approved.');
    },
    onError: (e) => toast.error(`Couldn't approve the comment: ${errorText(e)}`),
  });
  const remove = useMutation({
    mutationFn: api.deleteComment,
    onSuccess: () => {
      void refresh();
      toast.info('Comment deleted.');
    },
    onError: (e) => toast.error(`Couldn't delete the comment: ${errorText(e)}`),
  });

  return (
    <>
      <h1 tabIndex={-1} className="text-section font-semibold text-ink outline-none">
        Comments ({pending} pending)
      </h1>

      {isLoading ? (
        <p role="status" className="mt-6 text-body text-ink-muted">
          Loading comments...
        </p>
      ) : isError ? (
        <p role="alert" className="mt-6 text-body text-danger">
          Couldn&apos;t load comments.{' '}
          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-11 text-action underline"
          >
            Try again
          </button>
        </p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-body text-ink-muted">No comments yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {list.map((c) => (
            <li key={c.id} className="py-4">
              <div className="flex flex-wrap items-center gap-x-4">
                <p className="flex min-w-0 items-center gap-2 text-body text-ink max-sm:basis-full sm:flex-1">
                  {!c.approved && (
                    <span className="size-2 shrink-0 rounded-full bg-action">
                      <span className="sr-only">Pending:</span>
                    </span>
                  )}
                  <span className={c.approved ? 'truncate' : 'truncate font-semibold'}>
                    {c.name}
                  </span>
                  {c.blogs ? (
                    <span className="truncate text-caption text-ink-muted">on {c.blogs.title}</span>
                  ) : null}
                </p>
                <time dateTime={c.created_at} className="text-caption text-ink-muted tabular">
                  {new Date(c.created_at).toLocaleDateString()}
                </time>
                <div className="flex">
                  {!c.approved && (
                    <button
                      type="button"
                      onClick={() => approve.mutate(c.id)}
                      disabled={approve.isPending}
                      className="btn-text"
                    >
                      Approve
                    </button>
                  )}
                  <button type="button" onClick={() => setDeleting(c)} className="btn-text-danger">
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-body whitespace-pre-wrap wrap-break-word text-ink-muted">
                {c.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        title={deleting ? `Delete the comment from ${deleting.name}?` : null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
