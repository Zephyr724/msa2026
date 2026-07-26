import type { QueryClient } from '@tanstack/react-query';
import type { MyProgression } from '../../types/progression.ts';
import { validateMyProgression } from '../validation/progressionDto.ts';
import { ApiError, apiFetch } from './apiFetch.ts';
import { expirePrivateSession } from './privateCache.ts';

/**
 * Transport/validation for `GET /v1/users/me/progression`.
 *
 * The B1 session-expiry path runs against the exact ACTIVE QueryClient
 * passed in by the calling hook (`useQueryClient()`), never a hard-coded
 * module-level client: on a private 401 it awaits the ordered
 * cancel-then-remove cleanup, only then clears the auth session entry, and
 * only then rethrows — this function never resolves before cleanup has
 * finished, and the guard redirects only after the auth entry is null.
 */
export async function fetchMyProgression(options: {
  queryClient: QueryClient;
  signal?: AbortSignal;
}): Promise<MyProgression> {
  try {
    const payload = await apiFetch<unknown>('/v1/users/me/progression', {
      signal: options.signal,
    });
    return validateMyProgression(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await expirePrivateSession(options.queryClient);
    }
    throw error;
  }
}
