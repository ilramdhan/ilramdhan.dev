# Redesign screenshots

How the R0 baseline was captured, so later phases can capture "after" screenshots the same way.

- **Build:** `npm run build:e2e` with `VITE_SUPABASE_URL=https://mock.supabase.co VITE_SUPABASE_ANON_KEY=e2e-dummy-anon-key` (same as CI and Playwright). This prerenders 25 routes against the e2e mock dataset (`PRERENDER_MOCK=1`). A plain `npm run build` without those vars skips prerender, so it can't be used for screenshots.
- **Serve:** `npx vite preview --outDir dist-e2e --host 127.0.0.1 --port 4290 --strictPort` (port 4290, arbitrary free port).
- **Viewports:** 1440x900 and 375x812, `deviceScaleFactor: 1`. Full-page PNGs, capped at 6000px height (`clip`) when longer. Waits for `networkidle` then 1s for animations.
- **Theme:** set both ways. ilramdhan.dev stores the theme in `localStorage['theme']` (read by `src/app/ThemeContext.tsx`, `dark` class on `<html>`), and `colorScheme` is set on the context. The value is written with `addInitScript` before load. Mutugading uses `localStorage['mg-theme']` with `data-theme` on `<html>`.
- **Files:** `before/<slug>-<1440|375>-<light|dark>.png` (ilramdhan.dev: home, about, projects, project-detail, blog, blog-detail, certificates, privacy, terms, 404) and `reference/<slug>-<1440|375>-<light|dark>.png` (mutugading: home, products, product-detail, insights, article, about, legal-privacy, 404).
- **Browser:** installed Playwright chromium 1255 via `CHROMIUM_PATH` (see CONTRIBUTING). Run with `node /tmp/r0/shoot.cjs http://127.0.0.1:4290 <outDir>`.

Scripts (throwaway, kept here for reproducibility). `shoot.cjs` captures ilramdhan.dev. `shoot-ref.cjs` captures mutugading (`bun run dev -- -p 3100` in `$MG/web`, run with `node /tmp/r0/shoot-ref.cjs http://127.0.0.1:3100 <outDir>`).

`/tmp/r0/shoot.cjs`:

```js
// Throwaway R0 baseline capture. Usage: node /tmp/r0/shoot.cjs <baseUrl> <outDir>
const {
  chromium,
} = require('/Users/ilhamramadhan/WebstormProjects/ilramdhan.dev/node_modules/@playwright/test');
const fs = require('fs');
const [base, outDir] = process.argv.slice(2);
const ROUTES = [
  ['home', '/'],
  ['about', '/about'],
  ['projects', '/projects'],
  ['project-detail', '/projects/project-1'],
  ['blog', '/blog'],
  ['blog-detail', '/blog/blog-post-1'],
  ['certificates', '/certificates'],
  ['privacy', '/privacy'],
  ['terms', '/terms'],
  ['404', '/r0-missing-page'],
];
const VIEWPORTS = [
  [1440, 900],
  [375, 812],
];
const THEMES = ['light', 'dark'];
const MAX_H = 6000;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  for (const [slug, path] of ROUTES)
    for (const [w, h] of VIEWPORTS)
      for (const theme of THEMES) {
        const ctx = await browser.newContext({
          viewport: { width: w, height: h },
          colorScheme: theme,
          deviceScaleFactor: 1,
        });
        // Same mechanism as the site: localStorage 'theme' (ThemeContext STORAGE_KEY), applied before load.
        await ctx.addInitScript((t) => {
          try {
            localStorage.setItem('theme', t);
          } catch {}
        }, theme);
        const page = await ctx.newPage();
        await page.goto(base + path, { waitUntil: 'load' });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1000);
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        const file = `${outDir}/${slug}-${w}-${theme}.png`;
        await page.screenshot({
          path: file,
          fullPage: true,
          clip: height > MAX_H ? { x: 0, y: 0, width: w, height: MAX_H } : undefined,
        });
        console.log(`${file} h=${height}${height > MAX_H ? ' (capped)' : ''}`);
        await ctx.close();
      }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

`/tmp/r0/shoot-ref.cjs`:

```js
// Throwaway R0 reference capture (mutugading). Usage: node /tmp/r0/shoot-ref.cjs <baseUrl> <outDir>
const {
  chromium,
} = require('/Users/ilhamramadhan/WebstormProjects/ilramdhan.dev/node_modules/@playwright/test');
const fs = require('fs');
const [base, outDir] = process.argv.slice(2);
const ROUTES = [
  ['home', '/'],
  ['products', '/products'],
  ['product-detail', '/products/textile-dty'],
  ['insights', '/insights'],
  ['article', '/insights/how-to-specify-polyester-dty'],
  ['about', '/about'],
  ['legal-privacy', '/legal/privacy'],
  ['404', '/r0-missing-page'],
];
const VIEWPORTS = [
  [1440, 900],
  [375, 812],
];
const THEMES = ['light', 'dark'];
const MAX_H = 6000;
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  for (const [slug, path] of ROUTES)
    for (const [w, h] of VIEWPORTS)
      for (const theme of THEMES) {
        const ctx = await browser.newContext({
          viewport: { width: w, height: h },
          colorScheme: theme,
          deviceScaleFactor: 1,
        });
        // mutugading: localStorage 'mg-theme' read by THEME_SCRIPT -> <html data-theme>.
        await ctx.addInitScript((t) => {
          try {
            localStorage.setItem('mg-theme', t);
          } catch {}
        }, theme);
        const page = await ctx.newPage();
        await page.goto(base + path, { waitUntil: 'load', timeout: 60000 });
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(1500);
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        const file = `${outDir}/${slug}-${w}-${theme}.png`;
        await page.screenshot({
          path: file,
          fullPage: true,
          clip: height > MAX_H ? { x: 0, y: 0, width: w, height: MAX_H } : undefined,
        });
        console.log(`${file} h=${height}${height > MAX_H ? ' (capped)' : ''}`);
        await ctx.close();
      }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```
