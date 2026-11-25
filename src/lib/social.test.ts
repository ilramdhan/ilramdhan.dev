import { describe, expect, it } from 'vitest';
import { mailHref, socialEntries } from './social';

describe('socialEntries', () => {
  it('turns any stored mail value into one mailto: address', () => {
    expect(mailHref('me@ilramdhan.dev')).toBe('mailto:me@ilramdhan.dev');
    expect(mailHref('mailto:me@ilramdhan.dev')).toBe('mailto:me@ilramdhan.dev');
    expect(mailHref('https://mail.com/me@ilramdhan.dev')).toBe('mailto:me@ilramdhan.dev');
    expect(mailHref('mailto:me%40ilramdhan.dev?subject=hi')).toBe('mailto:me@ilramdhan.dev');
    expect(mailHref('https://mail.com/')).toBeUndefined();
  });

  it('keeps known, non-empty entries in order and drops a mail value without an address', () => {
    expect(
      socialEntries({
        github: 'github.com/me',
        mail: 'https://mail.com/me@ilramdhan.dev',
        unknown: 'x',
        linkedin: '',
      }),
    ).toEqual([
      ['github', 'https://github.com/me'],
      ['mail', 'mailto:me@ilramdhan.dev'],
    ]);
    expect(socialEntries({ mail: 'not an address' })).toEqual([]);
    expect(socialEntries(null)).toEqual([]);
  });
});
