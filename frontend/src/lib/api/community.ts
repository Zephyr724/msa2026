import type {
  CommunityChallenge,
  CommunityChallengeInput,
  MyProfile,
  WeeklyStreak,
} from '../../types/community';
import { apiFetch } from './apiFetch';

export function fetchMyProfile(): Promise<MyProfile> {
  return apiFetch<MyProfile>('/v1/users/me/profile');
}

export function updateMyProfile(input: {
  homeCommunityRegionId: string | null;
  showCommunityOnPassport: boolean;
}): Promise<MyProfile> {
  return apiFetch<MyProfile>('/v1/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function fetchWeeklyStreak(): Promise<WeeklyStreak> {
  return apiFetch<WeeklyStreak>('/v1/users/me/streak');
}

export function fetchCommunityChallenges(): Promise<CommunityChallenge[]> {
  return apiFetch<CommunityChallenge[]>('/v1/community-challenges');
}

export function createCommunityChallenge(
  input: CommunityChallengeInput,
): Promise<{ id: string; version: number }> {
  return apiFetch('/v1/admin/community-challenges', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCommunityChallenge(
  id: string,
  input: CommunityChallengeInput,
): Promise<{ id: string; version: number }> {
  return apiFetch(`/v1/admin/community-challenges/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function cancelCommunityChallenge(
  id: string,
  version: number,
): Promise<{ id: string; version: number }> {
  return apiFetch(`/v1/admin/community-challenges/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ version }),
  });
}
