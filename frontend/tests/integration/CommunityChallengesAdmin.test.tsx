import { QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CommunityChallengesSection from '../../src/components/community/CommunityChallengesSection.tsx';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import { resetCsrfToken } from '../../src/lib/api/apiFetch.ts';
import {
  createTestQueryClient,
  jsonResponse,
} from '../organizerTestUtils.tsx';

const localArea = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Henderson-Massey',
  type: 'LocalArea',
  parentRegionId: '22222222-2222-4222-8222-222222222222',
};

const aucklandCity = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Auckland',
  type: 'AdministrativeArea',
  parentRegionId: null,
};

const communityReward = {
  id: '33333333-3333-4333-8333-333333333333',
  code: 'community-spark',
  name: 'Community Spark',
  description: 'Complete a featured community challenge.',
  iconUrl: null,
  category: 'Community',
};

const secondCommunityReward = {
  id: '44444444-4444-4444-8444-444444444444',
  code: 'community-legacy',
  name: 'Community Legacy',
  description: 'Complete a landmark community challenge.',
  iconUrl: null,
  category: 'Community',
};

const milestone = {
  id: '55555555-5555-4555-8555-555555555555',
  code: 'verified-completions-1',
  name: 'First Steps',
  description: 'Complete one verified quest.',
  iconUrl: null,
  category: 'Milestone',
};

const activeChallenge = {
  id: '66666666-6666-4666-8666-666666666666',
  localArea,
  periodStartUtc: '2026-08-01T09:00:00.000Z',
  periodEndUtc: '2026-08-02T09:00:00.000Z',
  targetType: 'VerifiedCompletionCount',
  targetValue: 25,
  rewardAchievementId: communityReward.id,
  status: 'Active',
  currentProgress: 0,
  progressPercentage: 0,
  isPrivacyProtected: true,
  activeContributors: null,
  version: 7,
};

function renderAdmin(
  fetchMock: ReturnType<typeof vi.fn>,
) {
  vi.stubGlobal('fetch', fetchMock);
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authQueryKey, {
    userId: 'admin-1',
    displayName: 'Admin',
    email: 'admin@example.test',
    roles: ['Admin'],
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CommunityChallengesSection />
    </QueryClientProvider>,
  );
}

function createFetchMock(challenges: unknown[]) {
  return vi.fn((
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = String(input);
    if (url.includes('/v1/community-challenges')) {
      return Promise.resolve(jsonResponse(challenges));
    }
    if (url.includes('/v1/regions')) {
      if (url.includes('type=AdministrativeArea')) {
        return Promise.resolve(jsonResponse([aucklandCity]));
      }
      return Promise.resolve(jsonResponse([localArea]));
    }
    if (url.endsWith('/v1/achievements')) {
      return Promise.resolve(jsonResponse([
        milestone,
        communityReward,
        secondCommunityReward,
      ]));
    }
    if (url.endsWith('/v1/auth/csrf-token')) {
      return Promise.resolve(jsonResponse({ token: 'csrf-community' }));
    }
    if (
      url.endsWith('/v1/admin/community-challenges')
      && init?.method === 'POST'
    ) {
      return Promise.resolve(jsonResponse({
        id: activeChallenge.id,
        version: 1,
      }, 201));
    }
    if (
      url.endsWith(`/v1/admin/community-challenges/${activeChallenge.id}`)
      && init?.method === 'PATCH'
    ) {
      return Promise.resolve(jsonResponse({
        id: activeChallenge.id,
        version: 8,
      }));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
}

describe('Community challenge achievement rewards', () => {
  beforeEach(() => {
    resetCsrfToken();
  });

  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('offers only Community achievements and submits the selected reward on create', async () => {
    const user = userEvent.setup();
    const fetchMock = createFetchMock([]);
    renderAdmin(fetchMock);

    await screen.findByRole('option', { name: 'Community Spark' });
    const rewardSelect = await screen.findByLabelText(
      /Community achievement reward/,
    );
    expect(within(rewardSelect).getAllByRole('option')
      .map((option) => option.textContent))
      .toEqual([
        'No achievement reward',
        'Community Spark',
        'Community Legacy',
      ]);
    expect(within(rewardSelect).queryByRole('option', { name: 'First Steps' }))
      .not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText('Local Area'),
      localArea.id,
    );
    fireEvent.change(screen.getByLabelText('Starts'), {
      target: { value: '2026-08-01T09:00' },
    });
    fireEvent.change(screen.getByLabelText('Ends'), {
      target: { value: '2026-08-02T09:00' },
    });
    await user.selectOptions(rewardSelect, communityReward.id);
    await user.click(screen.getByRole('button', { name: 'Create challenge' }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) =>
      String(url).endsWith('/v1/admin/community-challenges')
      && init?.method === 'POST')).toBe(true));
    const createCall = fetchMock.mock.calls.find(([url, init]) =>
      String(url).endsWith('/v1/admin/community-challenges')
      && init?.method === 'POST');
    const submitted = JSON.parse(
      String(createCall?.[1]?.body),
    ) as Record<string, unknown>;
    expect(submitted).toMatchObject({
      localAreaRegionId: localArea.id,
      targetValue: 25,
      rewardAchievementId: communityReward.id,
    });
    expect(submitted).not.toHaveProperty('version');
  });

  it('preselects an existing reward and sends null plus version when cleared', async () => {
    const user = userEvent.setup();
    const fetchMock = createFetchMock([activeChallenge]);
    renderAdmin(fetchMock);

    await screen.findByRole('option', { name: 'Community Spark' });
    await user.click(screen.getByRole('button', {
      name: `Edit ${localArea.name}`,
    }));
    const rewardSelect = screen.getByLabelText(
      /Community achievement reward/,
    );
    expect(rewardSelect).toHaveValue(communityReward.id);

    await user.selectOptions(rewardSelect, '');
    await user.click(screen.getByRole('button', { name: 'Save challenge' }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) =>
      String(url).endsWith(
        `/v1/admin/community-challenges/${activeChallenge.id}`,
      ) && init?.method === 'PATCH')).toBe(true));
    const updateCall = fetchMock.mock.calls.find(([url, init]) =>
      String(url).endsWith(
        `/v1/admin/community-challenges/${activeChallenge.id}`,
      ) && init?.method === 'PATCH');
    const submitted = JSON.parse(
      String(updateCall?.[1]?.body),
    ) as Record<string, unknown>;
    expect(submitted).toMatchObject({
      localAreaRegionId: localArea.id,
      targetValue: activeChallenge.targetValue,
      rewardAchievementId: null,
      version: activeChallenge.version,
    });
  });
});
