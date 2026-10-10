/**
 * Typed application errors (T-15). Every data-layer call converts Supabase/PostgREST
 * and fetch failures into one of these with `toAppError()`, so the UI can tell a
 * missing record (show a 404) from a network problem (show a retry) and React Query
 * can skip retries for client errors.
 */

export type AppErrorKind = 'not_found' | 'auth' | 'validation' | 'network' | 'server' | 'unknown';

interface AppErrorInit {
  /** PostgREST / Postgres error code (`PGRST116`, `23505`, ...), if any. */
  code?: string;
  /** HTTP status of the response (0 = the request never got an answer). */
  status?: number;
  details?: string;
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind = 'unknown';
  readonly code?: string;
  readonly status?: number;
  readonly details?: string;

  constructor(message: string, init: AppErrorInit = {}) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = new.target.name;
    this.code = init.code || undefined;
    this.status = init.status;
    this.details = init.details || undefined;
  }

  /** True for errors that won't go away by retrying the same request (4xx). */
  get isClientError(): boolean {
    return false;
  }
}

/** The requested row/function doesn't exist (PGRST116 on `.single()`, HTTP 404). */
export class NotFoundError extends AppError {
  override readonly kind = 'not_found';
  override get isClientError() {
    return true;
  }
}

/** Not signed in, session expired or blocked by RLS (HTTP 401/403, 42501). */
export class AuthError extends AppError {
  override readonly kind = 'auth';
  override get isClientError() {
    return true;
  }
}

/** The request or the data was rejected (HTTP 400/409/422, constraint violations). */
export class ValidationError extends AppError {
  override readonly kind = 'validation';
  override get isClientError() {
    return true;
  }
}

/** No answer from the server (offline, DNS, CORS, aborted request). */
export class NetworkError extends AppError {
  override readonly kind = 'network';
}

/** The server answered with a 5xx. */
export class ServerError extends AppError {
  override readonly kind = 'server';
}

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  status?: unknown;
}

const NETWORK_MESSAGE =
  /failed to fetch|networkerror|network request failed|load failed|fetcherror|aborted/i;

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

/**
 * Converts anything thrown or returned by supabase-js / fetch into an `AppError`.
 * `status` is the HTTP status of the PostgREST response (`{ error, status }`).
 */
export function toAppError(error: unknown, status?: number): AppError {
  if (error instanceof AppError) return error;

  const e: ErrorLike = typeof error === 'object' && error !== null ? error : {};
  const message =
    str(e.message) || (typeof error === 'string' ? error : '') || 'Something went wrong';
  const code = str(e.code) ?? '';
  const httpStatus = status ?? (typeof e.status === 'number' ? e.status : undefined);
  const init: AppErrorInit = { code, status: httpStatus, details: str(e.details), cause: error };

  if (code === 'PGRST116' || code === 'PGRST202' || code === '42883' || httpStatus === 404) {
    return new NotFoundError(message, init);
  }
  if (code === '42501' || code.startsWith('PGRST30') || httpStatus === 401 || httpStatus === 403) {
    return new AuthError(message, init);
  }
  if (
    code.startsWith('22') ||
    code.startsWith('23') ||
    code.startsWith('PGRST1') ||
    httpStatus === 400 ||
    httpStatus === 409 ||
    httpStatus === 422
  ) {
    return new ValidationError(message, init);
  }
  // supabase-js reports a failed fetch as `{ status: 0, message: 'TypeError: Failed to fetch' }`.
  if (httpStatus === 0 || error instanceof TypeError || NETWORK_MESSAGE.test(message)) {
    return new NetworkError(message, init);
  }
  if (httpStatus !== undefined && httpStatus >= 500) return new ServerError(message, init);
  if (httpStatus !== undefined && httpStatus >= 400) return new ValidationError(message, init);
  return new AppError(message, init);
}

/** React Query `retry`: one retry for network/server errors, none for 4xx. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && !toAppError(error).isClientError;
}

/**
 * True when the database doesn't have the RPC function yet, i.e. the frontend was
 * deployed before its migration was applied. PGRST202 = function not in PostgREST's
 * schema cache (HTTP 404), 42883 = undefined function. Older PostgREST versions answer
 * 404 without a code, so the status and the message are checked too.
 */
export function isMissingFunctionError(
  error: { code?: string; message?: string } | null | undefined,
  status?: number,
): boolean {
  if (!error) return false;
  if (error.code === 'PGRST202' || error.code === '42883' || status === 404) return true;
  return /could not find the function|function .* does not exist/i.test(error.message ?? '');
}

/** True when `error` means "this record doesn't exist" (show a 404, don't retry). */
export function isNotFoundError(error: unknown): boolean {
  return error != null && toAppError(error) instanceof NotFoundError;
}
