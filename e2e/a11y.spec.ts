import { expect, test } from './fixtures/test';
import { expectNoA11yViolations } from './helpers/a11y';
import { PUBLIC_ROUTES } from './routes';
import { signIn } from './fixtures/session';

// Report-only for now (see helpers/a11y.ts): violations are attached to the report.
for (const route of PUBLIC_ROUTES) {
  test(`a11y: ${route.name} (${route.path})`, async ({ page }, testInfo) => {
    // axe on the home page (3D hero + Vanta WebGL loops) is slow under software rendering.
    // (Fake timers can't be used here: axe-core relies on setTimeout.)
    test.slow(route.path === '/');
    await page.goto(route.path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expectNoA11yViolations(page, testInfo);
  });
}

// F12: the dashboard (mock admin session) and the login page, enforced (axe 0) in both themes.
const ADMIN_SCREENS = [
  { path: '/login', h1: 'Admin login', auth: false },
  { path: '/admin', h1: 'General Settings', auth: true },
  { path: '/admin/projects', h1: 'Manage Projects', auth: true, open: 'Add Project' },
  { path: '/admin/messages', h1: 'Inbox (1)', auth: true },
];
for (const theme of ['light', 'dark'] as const) {
  test.describe(`a11y admin (${theme})`, () => {
    test.use({ theme, colorScheme: theme });
    for (const screen of ADMIN_SCREENS) {
      test(`${screen.path}${screen.open ? ' (form open)' : ''}`, async ({ page }, testInfo) => {
        if (screen.auth) await signIn(page);
        await page.goto(screen.path);
        await expect(page.getByRole('heading', { level: 1, name: screen.h1 })).toBeVisible();
        if (screen.open) await page.getByRole('button', { name: screen.open }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.waitForLoadState('networkidle');
        await expectNoA11yViolations(page, testInfo, { enforce: true });
      });
    }
  });
}
