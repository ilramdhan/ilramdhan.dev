import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('formats per locale', () => {
    expect(formatDate('2026-10-10T12:00:00Z', 'en')).toBe('Oct 10, 2026');
    expect(formatDate('2026-10-10T12:00:00Z', 'id')).toMatch(/^10 Okt(?:ober)? 2026$/);
  });
  it('does not shift date-only strings across time zones', () => {
    expect(formatDate('2025-01-01', 'en')).toBe('Jan 1, 2025');
  });
  it('supports styles', () => {
    expect(formatDate('2026-10-10T12:00:00Z', 'en', 'long')).toBe('October 10, 2026');
  });
  it('returns empty for missing or passes through unparseable input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('Present')).toBe('Present');
  });
});
