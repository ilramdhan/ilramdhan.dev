import { test as base, expect } from '@playwright/test';
import { installSupabaseMock, type SupabaseMock } from './supabase-mock';

export type Theme = 'dark' | 'light';

interface Fixtures {
  /** In-memory Supabase backend for this test (auto-installed on every page). */
  supabase: SupabaseMock;
  /** Console errors + uncaught page errors collected during the test. */
  consoleErrors: string[];
}

interface Options {
  /** Initial theme stored in localStorage before the app boots. */
  theme: Theme;
}

/**
 * Project-wide `test`: every page gets the Supabase mock, a deterministic theme and
 * console-error collection. Import `test`/`expect` from here, not from '@playwright/test'.
 */
export const test = base.extend<Fixtures & Options>({
  theme: ['dark', { option: true }],

  // Prerendered pages (T-35) show content before they are interactive: `goto`/`reload`
  // also wait for hydration (`data-hydrated` on <html>), so typing/clicking right after
  // navigation reaches React. Skipped for `waitUntil` other than `load` (no-JS checks).
  page: [
    async ({ page }, use) => {
      const waitForApp = () =>
        page
          .waitForFunction(() => document.documentElement.hasAttribute('data-hydrated'), null, {
            timeout: 10_000,
          })
          .catch(() => undefined);
      const goto = page.goto.bind(page);
      const reload = page.reload.bind(page);
      page.goto = async (url, options) => {
        const response = await goto(url, options);
        if ((options?.waitUntil ?? 'load') === 'load') await waitForApp();
        return response;
      };
      page.reload = async (options) => {
        const response = await reload(options);
        if ((options?.waitUntil ?? 'load') === 'load') await waitForApp();
        return response;
      };
      await use(page);
    },
    { scope: 'test' },
  ],

  supabase: [
    async ({ page }, use) => {
      await use(await installSupabaseMock(page));
    },
    { auto: true },
  ],

  consoleErrors: [
    async ({ page, theme }, use) => {
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {
          // storage unavailable — the app falls back to its default theme
        }
      }, theme);
      // vite preview serves the vercel.json CSP (Report-Only): surface violations as errors.
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          console.error(
            `CSP violation (${e.disposition}): ${e.effectiveDirective} blocked ${e.blockedURI || 'inline'}`,
          );
        });
      });
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
      await use(errors);
    },
    { auto: true },
  ],
});

export { expect };
