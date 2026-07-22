const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;

  constructor(status: number, problem?: ProblemDetails) {
    const title = problem?.title ?? 'Request failed';
    super(title);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

/**
 * Minimal typed fetch wrapper for the Kiwimpact API.
 * Sends credentials for future cookie authentication.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    let problem: ProblemDetails | undefined;
    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      // Response body is not JSON; use status text
    }
    throw new ApiError(response.status, problem);
  }

  // NoContent or empty body handling
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}