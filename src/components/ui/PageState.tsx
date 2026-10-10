import type { ReactNode } from 'react';

/** Grid-spanning "nothing here" message. */
export function EmptyState({
  children,
  className = 'py-20',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`col-span-full ${className} text-center text-slate-500`}>{children}</div>;
}

/** Grid-spanning error message with an optional retry action. */
export function ErrorState({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="col-span-full py-20 text-center text-red-500">
      {children}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-3 underline">
          Retry
        </button>
      )}
    </div>
  );
}
