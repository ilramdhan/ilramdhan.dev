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
