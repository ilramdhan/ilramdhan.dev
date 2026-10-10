import { describe, expect, it } from 'vitest';
import {
  AppError,
  AuthError,
  isNotFoundError,
  NetworkError,
  NotFoundError,
  ServerError,
  shouldRetry,
  toAppError,
  ValidationError,
} from './errors';

describe('toAppError', () => {
  it.each([
    [
      'PGRST116 (.single() found no row)',
      { code: 'PGRST116', message: 'no rows' },
      406,
      NotFoundError,
    ],
    ['PGRST202 (missing function)', { code: 'PGRST202', message: 'no fn' }, 404, NotFoundError],
    ['a bare 404', { message: 'Not Found' }, 404, NotFoundError],
    ['42501 (RLS / privilege)', { code: '42501', message: 'denied' }, 403, AuthError],
    ['PGRST301 (bad JWT)', { code: 'PGRST301', message: 'jwt' }, 401, AuthError],
    ['a bare 401', { message: 'Unauthorized' }, 401, AuthError],
    ['23505 (unique violation)', { code: '23505', message: 'dup' }, 409, ValidationError],
    ['22P02 (invalid input)', { code: '22P02', message: 'bad' }, 400, ValidationError],
    ['PGRST100 (bad filter)', { code: 'PGRST100', message: 'parse' }, 400, ValidationError],
    ['a bare 422', { message: 'nope' }, 422, ValidationError],
    [
      'a failed fetch (status 0)',
      { code: '', message: 'TypeError: Failed to fetch' },
      0,
      NetworkError,
    ],
    ['a 503', { message: 'unavailable' }, 503, ServerError],
  ])('maps %s', (_label, error, status, Expected) => {
    const mapped = toAppError(error, status);
    expect(mapped).toBeInstanceOf(Expected);
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped).toBeInstanceOf(Error);
    expect(mapped.message).toBe(error.message);
    expect(mapped.status).toBe(status);
  });

  it('keeps the PostgREST code and details', () => {
    const mapped = toAppError({ code: 'PGRST116', message: 'm', details: 'd' }, 406);
    expect(mapped).toMatchObject({ kind: 'not_found', code: 'PGRST116', details: 'd' });
    expect(mapped.name).toBe('NotFoundError');
  });

  it('treats a thrown TypeError (fetch) as a network error', () => {
    expect(toAppError(new TypeError('Failed to fetch'))).toBeInstanceOf(NetworkError);
  });

  it('reads the status from the error object when none is passed', () => {
    expect(toAppError({ message: 'gone', status: 404 })).toBeInstanceOf(NotFoundError);
  });

  it('returns AppErrors unchanged and wraps unknown values', () => {
    const original = new AuthError('x');
    expect(toAppError(original)).toBe(original);
    expect(toAppError('boom')).toMatchObject({ kind: 'unknown', message: 'boom' });
    expect(toAppError(undefined).message).toBe('Something went wrong');
  });
});

describe('shouldRetry', () => {
  it('retries network and server errors once', () => {
    expect(shouldRetry(0, new NetworkError('offline'))).toBe(true);
    expect(shouldRetry(0, new ServerError('500'))).toBe(true);
    expect(shouldRetry(1, new NetworkError('offline'))).toBe(false);
  });

  it('never retries 4xx errors', () => {
    expect(shouldRetry(0, new NotFoundError('missing'))).toBe(false);
    expect(shouldRetry(0, new AuthError('denied'))).toBe(false);
    expect(shouldRetry(0, new ValidationError('bad'))).toBe(false);
    expect(shouldRetry(0, { code: 'PGRST116', message: 'raw' })).toBe(false);
  });
});

describe('isNotFoundError', () => {
  it('is true only for "not found" errors', () => {
    expect(isNotFoundError(new NotFoundError('x'))).toBe(true);
    expect(isNotFoundError({ code: 'PGRST116', message: 'x' })).toBe(true);
    expect(isNotFoundError(new NetworkError('x'))).toBe(false);
    expect(isNotFoundError(null)).toBe(false);
  });
});
