const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}

const CSRF_PROBLEM_TYPE =
  'https://kiwimpact.app/problems/invalid-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
let csrfToken: string | null = null;
let csrfTokenRequest: Promise<string> | null = null;

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;
  retryAfterSeconds?: number;

  constructor(status: number, problem?: ProblemDetails, retryAfterSeconds?: number) {
    const title = problem?.title ?? 'Request failed';
    super(title);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Typed transport boundary for cookie-authenticated API requests.
 * Acquires and retries antiforgery tokens without exposing the auth cookie.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = (init?.method ?? 'GET').toUpperCase();
  const stateChanging = !SAFE_METHODS.has(method);
  const canReplay = init?.body === undefined || typeof init.body === 'string';

  if (stateChanging && csrfToken === null) {
    await getCsrfToken();
  }

  let response = await sendRequest(url, init, stateChanging);
  let problem = response.ok ? undefined : await readProblem(response);

  if (
    stateChanging &&
    canReplay &&
    response.status === 400 &&
    problem?.type === CSRF_PROBLEM_TYPE
  ) {
    resetCsrfToken();
    await getCsrfToken();
    response = await sendRequest(url, init, true);
    problem = response.ok ? undefined : await readProblem(response);
  }

  if (!response.ok) {
    throw new ApiError(response.status, problem, parseRetryAfter(response));
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function resetCsrfToken(): void {
  csrfToken = null;
  csrfTokenRequest = null;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken !== null) {
    return csrfToken;
  }

  csrfTokenRequest ??= fetch(`${API_BASE_URL}/v1/auth/csrf-token`, {
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError(response.status, await readProblem(response));
      }

      const body = (await response.json()) as { token?: unknown };
      if (typeof body.token !== 'string' || body.token.length === 0) {
        throw new ApiError(500, { title: 'Invalid antiforgery response' });
      }

      csrfToken = body.token;
      return body.token;
    })
    .finally(() => {
      csrfTokenRequest = null;
    });

  return csrfTokenRequest;
}

async function sendRequest(
  url: string,
  init: RequestInit | undefined,
  includeCsrf: boolean,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (includeCsrf && csrfToken !== null) {
    headers.set('X-CSRF-TOKEN', csrfToken);
  }

  return fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });
}

async function readProblem(
  response: Response,
): Promise<ProblemDetails | undefined> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}

/** Reads a delta-seconds Retry-After header; HTTP-date forms are ignored. */
function parseRetryAfter(response: Response): number | undefined {
  const value = response.headers.get('Retry-After');
  if (value === null) return undefined;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}
