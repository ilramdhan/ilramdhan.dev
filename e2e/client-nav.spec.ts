import { expect, test } from './fixtures/test';

// Regression (#123): after a full load of /, client-side navigation to pages that use
// Reveal (about, certificates, projects) must show their content without a reload. Their
// `m.*` elements need a LazyMotion ancestor, or they stay at the initial opacity: 0.
for (const [name, path, heading, text] of [
  ['About', '/about', 'Dummy Dev', 'Engineer'],
  ['Certificates', '/certificates', 'Certificates', 'Cert 1'],
  ['Projects', '/projects', /Projects/, 'Project 1'],
] as const) {
  test(`content is visible after navigating from home to ${path}`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Project 1', { exact: true }).first()).toBeAttached();
    const link = page.getByRole('link', { name, exact: true }).first();
    if (!(await link.isVisible())) await page.locator('nav button:has(svg.lucide-menu)').click();
    await link.click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    const item = page.getByText(text, { exact: true }).first();
    // Reveal animates on scroll into view (below the fold on mobile).
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
