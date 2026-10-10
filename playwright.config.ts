import { defineConfig, devices, type Project } from '@playwright/test';
import type { Theme } from './e2e/fixtures/test';

/**
 * E2E tests run against `vite preview` of a production build made with a fake
 * Supabase URL; every Supabase request is answered by `e2e/fixtures/supabase-mock.ts`.
 *
 * Projects:
 * - `w320` … `w2560`: responsive matrix — runs `smoke.spec.ts` only (keeps the run fast).
 * - `reduced-motion`, `light`: smoke on 1280 px with `prefers-reduced-motion` / light theme.
 * - `mobile`, `tablet`, `desktop`: every other spec on 360 / 768 / 1280 px
 *   (the report-only axe scan runs on `desktop` only).
 *
 * Run one project: `npm run test:e2e -- --project=w320`.
 */
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MATRIX = [320, 360, 390, 414, 768, 1024, 1280, 1440, 1920, 2560] as const;

const viewport = (width: number) => ({
  width,
  height: width < 768 ? 740 : width < 1440 ? 900 : 1080,
});
const SMOKE = /smoke\.spec\.ts$/;

type E2EProject = Project<{ theme?: Theme }>;

const matrixProjects: E2EProject[] = MATRIX.map((width) => ({
  name: `w${width}`,
  testMatch: SMOKE,
  use: { ...devices['Desktop Chrome'], viewport: viewport(width) },
}));

const featureProjects: E2EProject[] = [
  { name: 'mobile', width: 360 },
  { name: 'tablet', width: 768 },
  { name: 'desktop', width: 1280 },
].map(({ name, width }) => ({
  name,
  testIgnore: name === 'desktop' ? SMOKE : [SMOKE, /a11y\.spec\.ts$/],
  use: { ...devices['Desktop Chrome'], viewport: viewport(width) },
}));

export default defineConfig<{ theme?: Theme }>({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    ...matrixProjects,
    {
      name: 'reduced-motion',
      testMatch: SMOKE,
      use: {
        ...devices['Desktop Chrome'],
        viewport: viewport(1280),
        contextOptions: { reducedMotion: 'reduce' },
      },
    },
    {
      name: 'light',
      testMatch: SMOKE,
      use: { ...devices['Desktop Chrome'], viewport: viewport(1280), theme: 'light' },
    },
    ...featureProjects,
  ],
  webServer: {
    command: `npm run build:e2e && npx vite preview --outDir dist-e2e --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      // Must match MOCK_SUPABASE_URL in e2e/fixtures/supabase-mock.ts.
      VITE_SUPABASE_URL: 'https://mock.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-dummy-anon-key',
    },
  },
});
