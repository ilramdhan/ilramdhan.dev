import type { ReactNode } from 'react';

/** Grid-spanning "nothing here" message. */
export function EmptyState({
  children,
  className = 'py-20',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`col-span-full ${className} text-center text-ink-muted`}>{children}</div>;
}

/** Grid-spanning error message with an optional retry action. */
export function ErrorState({
  children,
  onRetry,
  retryLabel = 'Retry',
}: {
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="col-span-full py-20 text-center text-danger">
      {children}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-3 min-h-11 px-2 text-action underline"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
