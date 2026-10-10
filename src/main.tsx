import React from 'react';
import ReactDOM from 'react-dom/client';
import { EnvErrorScreen } from '@/app/error/EnvErrorScreen';
import { Providers } from '@/app/providers';
import { AppRoutes } from '@/app/routes';
import { envErrors } from '@/lib/env';
import '@/styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {envErrors.length > 0 ? (
      <EnvErrorScreen errors={envErrors} />
    ) : (
      <Providers>
        <AppRoutes />
      </Providers>
    )}
  </React.StrictMode>,
);
