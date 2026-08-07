import type { QueryClient } from '@tanstack/react-query';
import type {
  PublicPassport,
  PublicPassportSettings,
  VerifiedStoryContext,
} from '../../types/publicPassport.ts';
import {
  validatePublicPassport,
  validatePublicPassportSettings,
  validateVerifiedStoryContext,
} from '../validation/publicPassportDto.ts';
import { apiFetch } from './apiFetch.ts';
import { executePrivateQuery, executePrivateRequest } from './privateCache.ts';

export async function fetchPublicPassportSettings(
  queryClient: QueryClient,
  signal?: AbortSignal,
): Promise<PublicPassportSettings> {
  return executePrivateQuery(queryClient, ['public-passport', 'settings'], signal, async (signal) =>
    validatePublicPassportSettings(await apiFetch<unknown>('/v1/users/me/public-passport', { signal })));
}

export async function updatePublicPassportSettings(
  queryClient: QueryClient,
  input: { isEnabled: boolean; featuredAchievementIds: string[] },
  signal?: AbortSignal,
): Promise<PublicPassportSettings> {
  return executePrivateRequest(queryClient, async (requestSignal) =>
    validatePublicPassportSettings(await apiFetch<unknown>('/v1/users/me/public-passport', {
      method: 'PUT',
      body: JSON.stringify(input),
      signal: signal ?? requestSignal,
    })));
}

export async function fetchPublicPassport(
  shareId: string,
  signal?: AbortSignal,
): Promise<PublicPassport> {
  return validatePublicPassport(await apiFetch<unknown>(
    `/v1/public/passports/${encodeURIComponent(shareId)}`,
    { signal },
  ));
}

export async function fetchVerifiedStoryContext(
  queryClient: QueryClient,
  completionId: string,
  signal?: AbortSignal,
): Promise<VerifiedStoryContext> {
  return executePrivateQuery(
    queryClient,
    ['verified-story-context', completionId],
    signal,
    async (signal) => validateVerifiedStoryContext(await apiFetch<unknown>(
      `/v1/users/me/verified-completions/${encodeURIComponent(completionId)}/story-context`,
      { signal },
    )),
  );
}
