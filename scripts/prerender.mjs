#!/usr/bin/env node
// Prerenders every public route into static HTML after `vite build` (T-35).
// Usage: node scripts/prerender.mjs [outDir=dist]
//
// - Each route is rendered by src/entry-server.tsx (loaded through Vite, so aliases, env
//   and `define` match the client build) and written as `<route>.html` (`/` -> index.html),
//   with its head tags and the query data the browser hydrates from.
// - `spa.html` (empty shell) serves `/admin*`; `404.html` is the prerendered not-found page.
// - Without Supabase env vars the build stays a plain SPA (shell copied to spa/404.html):
//   `npm run build` works anywhere. If Supabase is configured but unreachable the build
//   fails, so Vercel keeps the previous deployment online instead of shipping empty pages.
// - PRERENDER_MOCK=1 renders against the e2e fixture dataset (CI, e2e), no network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'production';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.argv[2] ?? 'dist');
const templatePath = path.join(outDir, 'index.html');
const template = fs.readFileSync(templatePath, 'utf8');
const ROOT_TAG = '<div id="root"></div>';
if (!template.includes(ROOT_TAG)) throw new Error(`${ROOT_TAG} not found in ${templatePath}`);

const write = (file, html) => {
  const full = path.join(outDir, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
};
write('spa.html', template);

const { createServer } = await import('vite');
const vite = await createServer({
  root,
  mode: 'production',
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
});

try {
  if (process.env.PRERENDER_MOCK === '1') {
    const { installMockFetch } = await vite.ssrLoadModule('/e2e/fixtures/mock-fetch.ts');
    installMockFetch();
  }
  const { envErrors } = await vite.ssrLoadModule('/src/lib/env.ts');
  if (envErrors.length > 0) {
    write('404.html', template);
    console.warn(`[prerender] skipped (${envErrors.join('; ')}): the build is a plain SPA.`);
  } else {
    const entry = await vite.ssrLoadModule('/src/entry-server.tsx');
    const { serializePrerenderedData, PRERENDERED_DATA_ID } = await vite.ssrLoadModule(
      '/src/lib/prerendered-data.ts',
    );

    const page = async (url, hydrate) => {
      const { html, head, data } = await entry.render(url, true);
      const withHead = head ? entry.applyHeadToHtml(template, head) : template;
      const dataTag = `<script type="application/json" id="${PRERENDERED_DATA_ID}">${serializePrerenderedData(data)}</script>`;
      // `data-path`: the page the markup is for; the client hydrates only on that URL.
      const rootTag = `<div id="root"${hydrate ? ` data-path="${url}"` : ''}>${html}</div>`;
      return withHead.replace(ROOT_TAG, `${dataTag}\n    ${rootTag}`);
    };

    const routes = await entry.prerenderRoutes(true);
    for (const url of routes) {
      const file = url === '/' ? 'index.html' : `${decodeURIComponent(url).slice(1)}.html`;
      write(file, await page(url, true));
    }
    write('404.html', await page('/404', false));
    console.log(`[prerender] ${routes.length} routes + 404.html -> ${path.relative(root, outDir)}`);
  }
} finally {
  await vite.close();
}
// The rendered app leaves timers behind (Supabase auth refresh, React Query gc).
process.exit(0);
