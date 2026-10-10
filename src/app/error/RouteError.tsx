import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/PageState';

interface Props {
  children: ReactNode;
  /** Changing this value (e.g. the location) clears a caught error. */
  resetKey?: string;
}
interface State {
  error: Error | null;
}

/** Catches render errors so the user sees a friendly message instead of a white screen. */
export class RouteErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <main
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50 dark:bg-slate-950"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
        <ErrorState onRetry={() => this.setState({ error: null })}>
          An unexpected error occurred.{' '}
          <a href="/" className="underline">
            Go home
          </a>
          .
        </ErrorState>
      </main>
    );
  }
}
