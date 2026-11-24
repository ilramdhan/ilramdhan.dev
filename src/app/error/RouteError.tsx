import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/PageState';
import { dictionaryFor, LocaleContext } from '@/i18n';

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
      <LocaleContext.Consumer>
        {(locale) => {
          const t = dictionaryFor(locale);
          return (
            <main
              role="alert"
              className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50 dark:bg-slate-950"
            >
              <h1 className="text-2xl font-bold text-slate-900 dark:text-on-dark">
                {t.error.title}
              </h1>
              <ErrorState
                onRetry={() => this.setState({ error: null })}
                retryLabel={t.common.retry}
              >
                {t.error.body}{' '}
                <a href={locale === 'id' ? '/id' : '/'} className="underline">
                  {t.error.goHome}
                </a>
                .
              </ErrorState>
            </main>
          );
        }}
      </LocaleContext.Consumer>
    );
  }
}
