import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/messages/en';
import { id } from '@/i18n/messages/id';
import { validateContactForm as validate } from './contact-validation';

const validateContactForm = (data: FormData) => validate(data, en.contact.validation);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe('validateContactForm', () => {
  it('accepts a valid submission', () => {
    const result = validateContactForm(
      form({ name: 'Visitor', email: 'v@example.com', message: 'Hello, this is long enough.' }),
    );
    expect(result).toEqual({
      success: true,
      data: { name: 'Visitor', email: 'v@example.com', message: 'Hello, this is long enough.' },
    });
  });

  it('returns field errors for invalid input', () => {
    const result = validateContactForm(form({ name: 'V', email: 'nope', message: 'short' }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.name?.[0]).toMatch(/at least 2/);
    expect(result.error.email?.[0]).toMatch(/valid email/);
    expect(result.error.message?.[0]).toMatch(/at least 10/);
  });

  it('uses the supplied locale for error messages', () => {
    const result = validate(
      form({ name: 'V', email: 'nope', message: 'short' }),
      id.contact.validation,
    );
    if (result.success) throw new Error('expected failure');
    expect(result.error.name?.[0]).toBe(id.contact.validation.name);
  });
});
