import type { AuthSession, LoginInput, RegisterInput } from '../../types/auth.ts';
import { ApiError, apiFetch, resetCsrfToken } from './apiFetch.ts';

export async function fetchCurrentSession(): Promise<AuthSession | null> {
  try {
    return await apiFetch<AuthSession>('/v1/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return apiFetch<AuthSession>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const session = await apiFetch<AuthSession>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  resetCsrfToken();
  return session;
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/v1/auth/logout', { method: 'POST' });
  resetCsrfToken();
}
