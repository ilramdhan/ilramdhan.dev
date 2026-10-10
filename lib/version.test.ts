import { describe, expect, it } from 'vitest';
import { APP_VERSION, releaseUrl, versionAriaLabel, versionLabel } from './version';

describe('version helpers', () => {
  it('formats a semver as a v-prefixed label', () => {
    expect(versionLabel('0.3.0')).toBe('v0.3.0');
    expect(versionLabel('v1.2.3')).toBe('v1.2.3');
  });

  it('links to the matching GitHub Release tag', () => {
    expect(releaseUrl('0.3.0', 'https://github.com/o/r')).toBe(
      'https://github.com/o/r/releases/tag/v0.3.0',
    );
    expect(releaseUrl('0.3.0', 'https://github.com/o/r/')).toBe(
      'https://github.com/o/r/releases/tag/v0.3.0',
    );
  });

  it('mentions the build commit in the accessible label only when known', () => {
    expect(versionAriaLabel('0.3.0', '')).toBe('Release notes for version v0.3.0');
    expect(versionAriaLabel('0.3.0', 'abc1234')).toBe(
      'Release notes for version v0.3.0 (build abc1234)',
    );
  });

  it('exposes the injected package version as semver', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
