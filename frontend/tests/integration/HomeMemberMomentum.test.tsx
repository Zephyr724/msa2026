import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import HomePage from '../../src/pages/HomePage.tsx';
import {
  createTestQueryClient,
  jsonResponse,
} from '../organizerTestUtils.tsx';

describe('Home member momentum composition', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('composes authoritative progress, community, streak, missions, and challenge data', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/quests?')) {
        return Promise.resolve(jsonResponse({
          items: [],
          page: 1,
          pageSize: 3,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }));
      }
      if (url.endsWith('/v1/users/me/progression')) {
        return Promise.resolve(jsonResponse({
          totalXp: 120,
          level: 3,
          rankTitle: 'Novice',
        }));
      }
      if (url.endsWith('/v1/users/me/profile')) {
        return Promise.resolve(jsonResponse({
          displayName: 'Aroha',
          homeCommunity: {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            name: 'Henderson-Massey',
            type: 'LocalArea',
            parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          },
          showCommunityOnPassport: true,
          communityChangeAvailableAtUtc: null,
        }));
      }
      if (url.endsWith('/v1/users/me/streak')) {
        return Promise.resolve(jsonResponse({
          currentWeeks: 3,
          hasVerifiedImpactThisWeek: true,
        }));
      }
      if (url.includes('/v1/users/me/participations')) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.endsWith('/v1/community-challenges')) {
        return Promise.resolve(jsonResponse([{
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          localArea: {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            name: 'Henderson-Massey',
            type: 'LocalArea',
            parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          },
          periodStartUtc: '2026-07-01T00:00:00Z',
          periodEndUtc: '2026-08-01T00:00:00Z',
          targetType: 'VerifiedCompletionCount',
          targetValue: 50,
          rewardAchievementId: null,
          status: 'Active',
          currentProgress: 20,
          progressPercentage: 40,
          isPrivacyProtected: true,
          activeContributors: null,
          version: 1,
        }]));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authQueryKey, {
      userId: 'user-1',
      displayName: 'Aroha',
      email: 'member@example.test',
      roles: ['Member'],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Aroha' }))
      .toBeInTheDocument();
    expect(screen.getByText('MY PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('OUR PROGRESS')).toBeInTheDocument();
    expect(await screen.findByText('Level 3 · Novice · 120 XP')).toBeInTheDocument();
    expect(await screen.findByText('3 weeks')).toBeInTheDocument();
    expect(screen.getAllByText('Henderson-Massey')).not.toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Henderson-Massey Challenge' }))
      .toBeInTheDocument();
    expect(screen.getByText('20 / 50')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', {
      name: 'Henderson-Massey community challenge progress',
    })).toHaveValue(40);
    expect(screen.queryByRole('heading', { name: /Admin challenge management/ }))
      .not.toBeInTheDocument();
  });

  it('never falls back to another community\'s or a past challenge', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/quests?')) {
        return Promise.resolve(jsonResponse({
          items: [],
          page: 1,
          pageSize: 3,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }));
      }
      if (url.endsWith('/v1/users/me/progression')) {
        return Promise.resolve(jsonResponse({
          totalXp: 120,
          level: 3,
          rankTitle: 'Novice',
        }));
      }
      if (url.endsWith('/v1/users/me/profile')) {
        return Promise.resolve(jsonResponse({
          displayName: 'Aroha',
          homeCommunity: {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            name: 'Henderson-Massey',
            type: 'LocalArea',
            parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          },
          showCommunityOnPassport: true,
          communityChangeAvailableAtUtc: null,
        }));
      }
      if (url.endsWith('/v1/users/me/streak')) {
        return Promise.resolve(jsonResponse({
          currentWeeks: 3,
          hasVerifiedImpactThisWeek: true,
        }));
      }
      if (url.includes('/v1/users/me/participations')) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.endsWith('/v1/community-challenges')) {
        return Promise.resolve(jsonResponse([
          {
            id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            localArea: {
              id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
              name: 'Waitematā',
              type: 'LocalArea',
              parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            },
            periodStartUtc: '2026-07-01T00:00:00Z',
            periodEndUtc: '2026-08-01T00:00:00Z',
            targetType: 'VerifiedCompletionCount',
            targetValue: 30,
            rewardAchievementId: null,
            status: 'Active',
            currentProgress: 10,
            progressPercentage: 33,
            isPrivacyProtected: true,
            activeContributors: null,
            version: 1,
          },
          {
            id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
            localArea: {
              id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              name: 'Henderson-Massey',
              type: 'LocalArea',
              parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            },
            periodStartUtc: '2026-06-01T00:00:00Z',
            periodEndUtc: '2026-07-01T00:00:00Z',
            targetType: 'VerifiedCompletionCount',
            targetValue: 50,
            rewardAchievementId: null,
            status: 'Completed',
            currentProgress: 50,
            progressPercentage: 100,
            isPrivacyProtected: true,
            activeContributors: null,
            version: 1,
          },
        ]));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authQueryKey, {
      userId: 'user-1',
      displayName: 'Aroha',
      email: 'member@example.test',
      roles: ['Member'],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(
      /Henderson-Massey has no active challenge this month/,
    )).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Waitematā Challenge' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Henderson-Massey Challenge' }))
      .not.toBeInTheDocument();
    expect(screen.queryByText('Waitematā')).not.toBeInTheDocument();
  });
});
