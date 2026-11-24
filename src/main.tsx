import React from 'react';
import ReactDOM from 'react-dom/client';
import { EnvErrorScreen } from '@/app/error/EnvErrorScreen';
import { Providers } from '@/app/providers';
import { createQueryClient } from '@/app/query-client';
import { AppRoutes, preloadPage } from '@/app/routes';
import { loadLocale } from '@/i18n';
import { splitLocale } from '@/i18n/locale';
import { envErrors } from '@/lib/env';
import { beginHydration } from '@/lib/hooks';
import { seedPrerenderedData } from '@/lib/prerendered-data';
import '@/styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const queryClient = createQueryClient();
seedPrerenderedData(queryClient);

const app = (
  <React.StrictMode>
    {envErrors.length > 0 ? (
      <EnvErrorScreen errors={envErrors} />
    ) : (
      <Providers client={queryClient}>
        <AppRoutes />
      </Providers>
    )}
  </React.StrictMode>
);

// A prerendered page (T-35) is hydrated when it was built for this exact URL. Anything
// else renders from scratch: `/blog?tag=x` (another list), the 404 page served for a
// post published after the last build, the empty `/admin` shell.
const prerendered =
  rootElement.dataset.path === window.location.pathname && !window.location.search;
if (prerendered && envErrors.length === 0) {
  beginHydration();
  // The page chunk is loaded first so hydration never suspends on it.
  void preloadPage(window.location.pathname)
    .catch(() => undefined)
    .then(() => ReactDOM.hydrateRoot(rootElement, app));
} else {
  // Not prerendered for this URL (e.g. `/id/blog?tag=x`): still load its dictionary first.
  void loadLocale(splitLocale(window.location.pathname).locale)
    .catch(() => undefined)
    .then(() => ReactDOM.createRoot(rootElement).render(app));
}
