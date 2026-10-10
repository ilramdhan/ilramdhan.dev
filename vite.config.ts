import { readFileSync } from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { absoluteUrl, siteConfig } from './config/site';

/**
 * Build-time constants (`__APP_VERSION__`, `__APP_COMMIT__`, typed in `lib/globals.d.ts`).
 * The version comes from `package.json` (bumped by release-please); the commit
 * from Vercel's `VERCEL_GIT_COMMIT_SHA` when available.
 */
export function appVersionDefine() {
  const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
    version: string;
  };
  const commit = (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7);
  return {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(commit),
  };
}

/**
 * Site-wide response headers from `vercel.json` (the `/(.*)` rule: CSP, HSTS, …),
 * so `vite preview` — and the e2e suite that runs on it — serves the same
 * security headers as production and CSP regressions show up in tests.
 */
export function vercelSiteHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(path.resolve(__dirname, 'vercel.json'), 'utf8')) as {
    headers?: { source: string; headers: { key: string; value: string }[] }[];
  };
  const rule = config.headers?.find((h) => h.source === '/(.*)');
  return Object.fromEntries((rule?.headers ?? []).map(({ key, value }) => [key, value]));
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Injects values from `config/site.ts` into `index.html`:
 * replaces `%SITE_*%` placeholders and adds the JSON-LD `Person` block.
 */
function siteConfigHtml(): Plugin {
  const replacements: Record<string, string> = {
    SITE_NAME: siteConfig.name,
    SITE_TITLE: siteConfig.title,
    SITE_DESCRIPTION: siteConfig.description,
    SITE_OG_DESCRIPTION: siteConfig.ogDescription,
    SITE_URL: absoluteUrl('/'),
    SITE_OG_IMAGE: absoluteUrl(siteConfig.ogDefaultImage),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.name,
    url: siteConfig.url,
    jobTitle: siteConfig.jobTitle,
    sameAs: [siteConfig.social.github, siteConfig.social.linkedin],
    image: absoluteUrl(siteConfig.ogDefaultImage),
    description: siteConfig.jsonLdDescription,
  };

  return {
    name: 'site-config-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return {
          html: html.replace(/%(SITE_[A-Z_]+)%/g, (match, key: string) => {
            const value = replacements[key];
            return value === undefined ? match : escapeHtml(value);
          }),
          tags: [
            {
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              children: JSON.stringify(jsonLd, null, 2).replace(/</g, '\\u003c'),
              injectTo: 'head',
            },
          ],
        };
      },
    },
  };
}

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      headers: vercelSiteHeaders(),
    },
    plugins: [react(), siteConfigHtml()],
    define: appVersionDefine(),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
