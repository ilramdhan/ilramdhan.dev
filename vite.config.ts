import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { absoluteUrl, siteConfig } from './src/config/site';

/**
 * Build-time constants (`__APP_VERSION__`, `__APP_COMMIT__`, typed in `src/types/globals.d.ts`).
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

/**
 * `vite preview` routing that mirrors `vercel.json` for the prerendered build (T-35):
 * `/about` -> `about.html` (clean URLs), `/admin*` -> the SPA shell, any other unknown
 * page -> `404.html` with status 404. Lets the e2e suite test what production serves.
 */
function previewRouting(): Plugin {
  return {
    name: 'preview-routing',
    configurePreviewServer(server) {
      const outDir = path.resolve(__dirname, server.config.build.outDir);
      const headers = vercelSiteHeaders();
      server.middlewares.use((req, res, next) => {
        const accept = req.headers.accept ?? '';
        if (req.method !== 'GET' || !accept.includes('text/html')) return next();
        const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
        if (pathname === '/' || path.extname(pathname)) return next();
        const page = path.join(outDir, `${pathname.replace(/\/$/, '')}.html`);
        if (page.startsWith(outDir) && existsSync(page)) return next();
        if (/^\/admin(\/|$)/.test(pathname) && existsSync(path.join(outDir, 'spa.html'))) {
          req.url = '/spa.html';
          return next();
        }
        const notFound = path.join(outDir, '404.html');
        if (!existsSync(notFound)) return next();
        res.writeHead(404, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
        res.end(readFileSync(notFound));
      });
    },
  };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Injects values from `src/config/site.ts` into `index.html`:
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

/**
 * Vendor chunk groups (T-24). Long-lived libraries get their own files so they stay
 * cached across deploys, and heavy ones (three.js, charts, markdown) are only fetched by
 * the lazy chunks that import them, never by the entry.
 */
const VENDOR_CHUNKS: [name: string, pattern: RegExp][] = [
  [
    'three',
    /[\\/]node_modules[\\/](three|three-stdlib|@react-three|@dimforge|meshline|troika-[^/\\]+|camera-controls|maath|@monogrid|stats-gl|suspend-react|its-fine|zustand|react-reconciler)[\\/]/,
  ],
  [
    'charts',
    /[\\/]node_modules[\\/](recharts|d3-[^/\\]+|victory-vendor|@reduxjs|redux|react-redux|reselect|immer|decimal\.js-light|es-toolkit|eventemitter3)[\\/]/,
  ],
  // GFM is lazy-loaded (components/ui/MarkdownGfm) only for content that uses it; listed
  // before 'markdown' so its packages don't land in the always-needed markdown chunk.
  [
    'markdown-gfm',
    /[\\/]node_modules[\\/](remark-gfm|micromark-extension-gfm[^/\\]*|mdast-util-gfm[^/\\]*|mdast-util-find-and-replace|mdast-util-to-markdown|mdast-util-phrasing|markdown-table|escape-string-regexp|longest-streak|ccount|zwitch|remark-stringify)[\\/]/,
  ],
  // Syntax highlighting is lazy-loaded (components/ui/MarkdownHighlight) only for content
  // with a fenced code block that names a language.
  ['highlight', /[\\/]node_modules[\\/](lowlight|highlight\.js)[\\/]/],
  [
    'markdown',
    /[\\/]node_modules[\\/](react-markdown|remark-[^/\\]+|rehype-[^/\\]+|unified|micromark[^/\\]*|mdast-[^/\\]+|hast-[^/\\]+|unist-[^/\\]+|vfile[^/\\]*|property-information|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities[^/\\]*|devlop|bail|trough|is-plain-obj|zwitch|longest-streak|ccount|trim-lines|html-url-attributes|estree-util-[^/\\]+|style-to-[^/\\]+|inline-style-parser)[\\/]/,
  ],
  // framer-motion is deliberately not pinned to a chunk: LazyMotion (components/motion/features)
  // loads its animation features through a dynamic import, which a manual chunk would defeat.
  ['supabase', /[\\/]node_modules[\\/](@supabase|tslib|ws|iceberg-js)[\\/]/],
  ['router-query', /[\\/]node_modules[\\/](react-router|@tanstack)[\\/]/],
  ['react', /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/],
  // `cn()` is used by most components; keep it out of heavy chunks Rollup might hoist it into.
  ['classnames', /[\\/]node_modules[\\/](tailwind-merge|clsx)[\\/]/],
];

export function vendorChunk(id: string): string | undefined {
  // Rollup/Vite runtime helpers (dynamic-import preloader, CJS interop) are shared by
  // every chunk; pin them to the always-loaded `react` chunk, otherwise Rollup may hoist
  // them into a heavy vendor chunk (it picked `three`) and drag that into the entry.
  if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'react';
  // The lazily loaded Markdown renderer (T-58) travels with its libraries: one request.
  if (
    /[\\/]src[\\/](components[\\/]ui[\\/]MarkdownRenderer|lib[\\/]markdown-url)\.tsx?$/.test(id)
  ) {
    return 'markdown';
  }
  if (/[\\/]src[\\/]components[\\/]ui[\\/]MarkdownGfm\.tsx$/.test(id)) return 'markdown-gfm';
  if (/[\\/]src[\\/]components[\\/]ui[\\/]MarkdownHighlight\.tsx$/.test(id)) return 'highlight';
  // Shared by `Img` (always loaded) and the lazy Markdown renderer: without the pin Rollup
  // puts it in `markdown`, and every page with an image loads the parser up front.
  if (/[\\/]src[\\/]lib[\\/]image-dimensions\.ts$/.test(id)) return 'react';
  if (!id.includes('node_modules')) return undefined;
  return VENDOR_CHUNKS.find(([, pattern]) => pattern.test(id))?.[0];
}

export default defineConfig(async () => {
  // ESM-only package: load it lazily, and only when analysing (`npm run analyze`).
  const analyze =
    process.env.ANALYZE === '1'
      ? [
          (await import('rollup-plugin-visualizer')).visualizer({
            filename: 'dist/stats.html',
            template: 'treemap',
            gzipSize: true,
          }),
        ]
      : [];
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      headers: vercelSiteHeaders(),
    },
    plugins: [react(), siteConfigHtml(), previewRouting(), ...analyze],
    define: appVersionDefine(),
    build: {
      rollupOptions: {
        output: { manualChunks: vendorChunk },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
