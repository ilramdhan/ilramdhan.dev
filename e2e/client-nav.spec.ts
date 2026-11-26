import { expect, test } from './fixtures/test';

// Regression (#123): after a full load of /, client-side navigation to pages with scroll
// entrance animations (about, certificates, projects) must show their content without a
// reload: no element may be left at its initial opacity: 0.
for (const [name, path, heading, text] of [
  ['About', '/about', 'Dummy Dev', 'Engineer'],
  ['Certificates', '/certificates', 'Certificates', 'Cert 1'],
  ['Projects', '/projects', /Projects/, 'Project 1'],
] as const) {
  test(`content is visible after navigating from home to ${path}`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Project 1', { exact: true }).first()).toBeAttached();
    const menu = page.getByRole('button', { name: 'Open menu' });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name, exact: true })
      .locator('visible=true')
      .first()
      .click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    const item = page.getByText(text, { exact: true }).first();
    // Entrance animations run on scroll into view (below the fold on mobile).
    await item.scrollIntoViewIfNeeded();
    await expect(item).toBeVisible();
    // Painted, not just laid out: no ancestor left at opacity 0 by an entrance animation.
    await expect
      .poll(() =>
        item.evaluate((el) => {
          for (let n: Element | null = el; n; n = n.parentElement)
            if (Number(getComputedStyle(n).opacity) < 0.99) return false;
          return true;
        }),
      )
      .toBe(true);
  });
}
