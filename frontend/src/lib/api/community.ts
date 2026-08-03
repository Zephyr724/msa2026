import type {
  CommunityChallenge,
  CommunityChallengeInput,
  MyProfile,
  WeeklyStreak,
} from '../../types/community';
import { apiFetch } from './apiFetch';

export function fetchMyProfile(signal?: AbortSignal): Promise<MyProfile> {
  return apiFetch<MyProfile>('/v1/users/me/profile', { signal });
}

export function updateMyProfile(input: {
  homeCommunityRegionId: string | null;
  showCommunityOnPassport: boolean;
}, signal?: AbortSignal): Promise<MyProfile> {
  return apiFetch<MyProfile>('/v1/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
    signal,
  });
}

export function fetchWeeklyStreak(signal?: AbortSignal): Promise<WeeklyStreak> {
  return apiFetch<WeeklyStreak>('/v1/users/me/streak', { signal });
}

export function fetchCommunityChallenges(): Promise<CommunityChallenge[]> {
  return apiFetch<CommunityChallenge[]>('/v1/community-challenges');
}

export function createCommunityChallenge(
  input: CommunityChallengeInput,
  signal?: AbortSignal,
): Promise<{ id: string; version: number }> {
  return apiFetch('/v1/admin/community-challenges', {
    method: 'POST',
    body: JSON.stringify(input),
    signal,
  });
}

export function updateCommunityChallenge(
  id: string,
  input: CommunityChallengeInput,
  signal?: AbortSignal,
): Promise<{ id: string; version: number }> {
  return apiFetch(`/v1/admin/community-challenges/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    signal,
  });
}

export function cancelCommunityChallenge(
  id: string,
  version: number,
  signal?: AbortSignal,
): Promise<{ id: string; version: number }> {
  return apiFetch(`/v1/admin/community-challenges/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ version }),
    signal,
  });
}
