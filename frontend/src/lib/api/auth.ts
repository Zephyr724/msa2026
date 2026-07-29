import type {
  AccountLifecycleResult, AuthSession, LoginInput, RegisterInput,
} from '../../types/auth.ts';
import { ApiError, apiFetch, resetCsrfToken } from './apiFetch.ts';

export function normalizeAccountLifecycleToken(token: string): string {
  return token.replaceAll(' ', '+');
}

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

export function confirmEmail(userId: string, token: string): Promise<AccountLifecycleResult> {
  return apiFetch('/v1/auth/confirm-email', {
    method: 'POST', body: JSON.stringify({ userId, token }),
  });
}

export function resendConfirmation(email: string): Promise<AccountLifecycleResult> {
  return apiFetch('/v1/auth/resend-confirmation', {
    method: 'POST', body: JSON.stringify({ email }),
  });
}

export function forgotPassword(email: string): Promise<AccountLifecycleResult> {
  return apiFetch('/v1/auth/forgot-password', {
    method: 'POST', body: JSON.stringify({ email }),
  });
}

export function resetPassword(
  email: string, token: string, password: string, passwordConfirmation: string,
): Promise<AccountLifecycleResult> {
  return apiFetch('/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, password, passwordConfirmation }),
  });
}

export function changePassword(
  currentPassword: string, newPassword: string, newPasswordConfirmation: string,
): Promise<AccountLifecycleResult> {
  return apiFetch('/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirmation }),
  });
}
