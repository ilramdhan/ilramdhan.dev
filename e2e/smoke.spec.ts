import { expect, test } from './fixtures/test';
import { horizontalOverflow, overflowingElements, runningAnimations } from './helpers/layout';
import { PUBLIC_ROUTES } from './routes';

/**
 * Known layout bugs, tracked in issues. The horizontal-scroll check for these
 * route/width combinations is marked `test.fixme` (reported as skipped) instead
 * of failing the suite. Remove the entry in the PR that fixes the issue.
 */
const KNOWN_HSCROLL: { paths: string[]; maxWidth: number; issue: string }[] = [
  // Long words in detail-page titles overflow on phones. How far depends on the
  // system font (the site has no web font): ~320 px locally, up to 414 px on the
  // Ubuntu CI runner.
  { paths: ['/projects/long-content', '/blog/long-content'], maxWidth: 414, issue: '#37' },
  // "View All Certificates" header button overflows by ~4 px at 320 px with wider
  // system fonts (DejaVu Sans on the CI runner).
  { paths: ['/about'], maxWidth: 320, issue: '#37' },
];

function knownHScrollIssue(path: string, width: number) {
  return KNOWN_HSCROLL.find((k) => k.paths.includes(path) && width <= k.maxWidth)?.issue;
}

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} (${route.path}) renders its H1, no console errors, no horizontal scroll`, async ({
    page,
    consoleErrors,
  }, testInfo) => {
    await page.clock.install();
    await page.goto(route.path);
    const h1 = page.getByRole('heading', { level: 1 }).first();
    if (route.h1 === null) {
      // Typewriter text cycles (and is briefly empty), so only check visibility.
      await expect(h1).toBeVisible();
    } else {
      await expect(h1).toHaveText(route.h1);
    }
    await page.waitForLoadState('networkidle');
    expect(consoleErrors, 'console errors').toEqual([]);
    // Freeze timers/animation frames: the home page's WebGL loops otherwise make
    // every following page.evaluate crawl under software rendering.
    await page.clock.pauseAt(Date.now() + 60_000);

    if (testInfo.project.name === 'reduced-motion') {
      // Report-only until the motion system work lands (PLAN §3.8).
      testInfo.annotations.push({
        type: 'running animations (reduced motion)',
        description: String(await runningAnimations(page)),
      });
    }

    const width = page.viewportSize()?.width ?? 0;
    const issue = knownHScrollIssue(route.path, width);
    // H1/console checks above still ran; only the overflow assertion is skipped.
    test.fixme(!!issue, `Horizontal scroll at ${width}px — known bug ${issue}`);

    const overflow = await horizontalOverflow(page);
    const culprits = overflow > 0 ? (await overflowingElements(page)).join(', ') : '';
    expect(overflow, `px of horizontal overflow (elements past the right edge: ${culprits})`).toBe(
      0,
    );
  });
}

test('unknown route shows a 404 page', async ({ page }) => {
  test.fixme(true, 'No 404 route yet — tracked in #34');
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/not found|404/i);
});
