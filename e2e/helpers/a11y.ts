import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Runs axe-core (WCAG 2.x A/AA) on the current page.
 *
 * Report-only for now: violations are attached to the test report and logged as
 * annotations but do NOT fail the test. Pass `{ enforce: true }` (or set
 * `E2E_A11Y_ENFORCE=1`) once the a11y backlog is cleared to make them blocking.
 */
export async function expectNoA11yViolations(
  page: Page,
  testInfo: TestInfo,
  { enforce = process.env.E2E_A11Y_ENFORCE === '1' }: { enforce?: boolean } = {},
) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.impact ?? 'unknown'} ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
  );
  if (summary.length) {
    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
    testInfo.annotations.push({ type: 'a11y (report-only)', description: summary.join('\n') });
  }
  if (enforce) expect(summary, 'axe violations').toEqual([]);
  return results.violations;
}
