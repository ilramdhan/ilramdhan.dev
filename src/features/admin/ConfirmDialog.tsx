import { Dialog } from '@/components/ui/Dialog';

/** "Delete X?" sheet: Cancel has focus first (the safe choice), Esc and the backdrop cancel too. */
export function ConfirmDialog({
  title,
  onConfirm,
  onClose,
}: {
  /** The question; `null` = closed. */
  title: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={title !== null} onClose={onClose} title={title ?? ''}>
      <h2 className="text-title font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-body text-ink-muted">This can&apos;t be undone.</p>
      <div className="mt-8 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onConfirm();
          }}
          className="btn-primary"
        >
          Delete
        </button>
      </div>
    </Dialog>
  );
}
