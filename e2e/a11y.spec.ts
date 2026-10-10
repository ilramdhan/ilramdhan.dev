import { expect, test } from './fixtures/test';
import { expectNoA11yViolations } from './helpers/a11y';
import { PUBLIC_ROUTES } from './routes';

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
