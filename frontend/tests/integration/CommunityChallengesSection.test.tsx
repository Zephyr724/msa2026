import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CommunityChallengesSection from '../../src/components/community/CommunityChallengesSection.tsx';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import {
  createTestQueryClient,
  jsonResponse,
} from '../organizerTestUtils.tsx';

const aucklandCity = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'Auckland',
  type: 'AdministrativeArea',
  parentRegionId: null,
};

const wellingtonCity = {
  id: '99999999-9999-4999-8999-999999999999',
  name: 'Wellington',
  type: 'AdministrativeArea',
  parentRegionId: null,
};

const homeArea = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Henderson-Massey',
  type: 'LocalArea',
  parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

const otherArea = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  name: 'Waitematā',
  type: 'LocalArea',
  parentRegionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

// Outside the Auckland launch boundary; listed first on purpose so tests
// prove it can neither leak into the selector nor become the default view.
const wellingtonArea = {
  id: '88888888-8888-4888-8888-888888888888',
  name: 'Wellington Central',
  type: 'LocalArea',
  parentRegionId: '99999999-9999-4999-8999-999999999999',
};

const communityReward = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  code: 'community-catalyst',
  name: 'Community Catalyst',
  description: 'Contribute to a completed community challenge.',
  iconUrl: null,
  category: 'Community',
};

function challenge(overrides: Record<string, unknown>) {
  return {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    localArea: homeArea,
    periodStartUtc: '2026-08-01T00:00:00.000Z',
    periodEndUtc: '2026-09-01T00:00:00.000Z',
    targetType: 'VerifiedCompletionCount',
    targetValue: 25,
    rewardAchievementId: null,
    status: 'Active',
    currentProgress: 5,
    progressPercentage: 20,
    isPrivacyProtected: false,
    activeContributors: 12,
    version: 1,
    ...overrides,
  };
}

const homeActive = challenge({
  id: '10000000-0000-4000-8000-000000000001',
  rewardAchievementId: communityReward.id,
  targetValue: 25,
});
const homeCompletedJuly = challenge({
  id: '10000000-0000-4000-8000-000000000002',
  status: 'Completed',
  targetValue: 50,
  periodStartUtc: '2026-07-01T00:00:00.000Z',
  periodEndUtc: '2026-08-01T00:00:00.000Z',
});
const homeFailedJune = challenge({
  id: '10000000-0000-4000-8000-000000000003',
  status: 'Failed',
  targetValue: 40,
  periodStartUtc: '2026-06-01T00:00:00.000Z',
  periodEndUtc: '2026-07-01T00:00:00.000Z',
});
const otherActive = challenge({
  id: '10000000-0000-4000-8000-000000000004',
  localArea: otherArea,
  targetValue: 30,
});
const otherCompleted = challenge({
  id: '10000000-0000-4000-8000-000000000005',
  localArea: otherArea,
  status: 'Completed',
  targetValue: 60,
  periodStartUtc: '2026-07-01T00:00:00.000Z',
  periodEndUtc: '2026-08-01T00:00:00.000Z',
});
const wellingtonActive = challenge({
  id: '10000000-0000-4000-8000-000000000006',
  localArea: wellingtonArea,
  targetValue: 15,
});

const allChallenges = [
  wellingtonActive,
  homeActive,
  homeCompletedJuly,
  homeFailedJune,
  otherActive,
  otherCompleted,
];

const memberSession = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

function challengeRequests(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname.endsWith('/v1/community-challenges'));
}

function stubApi(profile: unknown | null, options: { profileFails?: boolean } = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname.endsWith('/v1/community-challenges')) {
      const regionId = url.searchParams.get('regionId');
      const status = url.searchParams.get('status');
      let rows = allChallenges;
      if (regionId) rows = rows.filter((item) => item.localArea.id === regionId);
      if (status) rows = rows.filter((item) => item.status === status);
      return Promise.resolve(jsonResponse(rows));
    }
    if (url.pathname.includes('/v1/regions')) {
      if (url.searchParams.get('type') === 'AdministrativeArea') {
        return Promise.resolve(jsonResponse([aucklandCity, wellingtonCity]));
      }
      // Wellington Central is deliberately listed first: the boundary filter
      // must still exclude it and never default to it.
      return Promise.resolve(jsonResponse([wellingtonArea, homeArea, otherArea]));
    }
    if (url.pathname.endsWith('/v1/achievements')) {
      return Promise.resolve(jsonResponse([communityReward]));
    }
    if (url.pathname.endsWith('/v1/users/me/profile')) {
      if (options.profileFails) {
        return Promise.resolve(jsonResponse({ detail: 'Profile unavailable.' }, 500));
      }
      return Promise.resolve(profile
        ? jsonResponse(profile)
        : jsonResponse({ title: 'Unauthorized' }, 401));
    }
    if (url.pathname.endsWith('/v1/auth/me')) {
      return Promise.resolve(jsonResponse({ title: 'Unauthorized' }, 401));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderSection(signedIn: boolean) {
  const queryClient = createTestQueryClient();
  if (signedIn) queryClient.setQueryData(authQueryKey, memberSession);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CommunityChallengesSection showAdminControls={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const homeProfile = {
  displayName: 'Aroha',
  homeCommunity: homeArea,
  showCommunityOnPassport: true,
  communityChangeAvailableAtUtc: null,
};

describe('CommunityChallengesSection', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('defaults a signed-in member to their home community\'s Active challenge', async () => {
    const fetchMock = stubApi(homeProfile);
    renderSection(true);

    expect(await screen.findByText('Your community · Henderson-Massey'))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '25 verified actions' }))
      .toBeInTheDocument();
    // Past results are never mixed into the current view.
    expect(screen.queryByRole('heading', { name: '50 verified actions' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '30 verified actions' }))
      .not.toBeInTheDocument();

    await waitFor(() => {
      expect(challengeRequests(fetchMock).some((url) =>
        url.searchParams.get('regionId') === homeArea.id
        && url.searchParams.get('status') === 'Active')).toBe(true);
    });
  });

  it('switches the requested region and status with the browse controls', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi(homeProfile);
    renderSection(true);
    await screen.findByText('Your community · Henderson-Massey');

    await user.selectOptions(screen.getByLabelText('Community'), otherArea.id);
    expect(await screen.findByText('Current challenge · Waitematā'))
      .toBeInTheDocument();
    await waitFor(() => {
      expect(challengeRequests(fetchMock).some((url) =>
        url.searchParams.get('regionId') === otherArea.id
        && url.searchParams.get('status') === 'Active')).toBe(true);
    });

    await user.click(screen.getByRole('button', { name: 'Past results' }));
    expect(await screen.findByText('Past results · Waitematā'))
      .toBeInTheDocument();
    await waitFor(() => {
      expect(challengeRequests(fetchMock).some((url) =>
        url.searchParams.get('regionId') === otherArea.id
        && url.searchParams.get('status') === null)).toBe(true);
    });
    // The past view shows only that community's historical results.
    expect(screen.getByRole('heading', { name: '60 verified actions' }))
      .toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '30 verified actions' }))
      .not.toBeInTheDocument();
  });

  it('lists a community\'s past challenges newest-first under a past label', async () => {
    const user = userEvent.setup();
    stubApi(homeProfile);
    renderSection(true);
    await screen.findByText('Your community · Henderson-Massey');

    await user.click(screen.getByRole('button', { name: 'Past results' }));

    expect(await screen.findByText('Past results · Henderson-Massey'))
      .toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { name: /verified actions/ });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      '50 verified actions',
      '40 verified actions',
    ]);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('shows the resolved reward name and truthful copy when there is none', async () => {
    stubApi(homeProfile);
    renderSection(true);

    expect(await screen.findByText('Reward: Community Catalyst achievement'))
      .toBeInTheDocument();

    await userEvent.setup()
      .selectOptions(screen.getByLabelText('Community'), otherArea.id);
    expect(await screen.findByText('No bonus reward this month'))
      .toBeInTheDocument();
    expect(screen.queryByText(/Community Catalyst/)).not.toBeInTheDocument();
  });

  it('invites members without a home community to choose one', async () => {
    const fetchMock = stubApi({ ...homeProfile, homeCommunity: null });
    renderSection(true);

    const invite = await screen.findByText(/have not chosen a home community/);
    expect(invite).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Choose your home community' });
    expect(link).toHaveAttribute('href', '/settings/profile');
    // Browse still defaults to a listed community instead of a mixed grid.
    expect(await screen.findByText('Current challenge · Henderson-Massey'))
      .toBeInTheDocument();
    await waitFor(() => {
      expect(challengeRequests(fetchMock).some((url) =>
        url.searchParams.get('regionId') === homeArea.id
        && url.searchParams.get('status') === 'Active')).toBe(true);
    });
  });

  it('says so truthfully when the member\'s community has no active challenge', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = new URL(String(input), 'http://localhost');
      if (url.pathname.endsWith('/v1/community-challenges')) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.pathname.includes('/v1/regions')) {
        if (url.searchParams.get('type') === 'AdministrativeArea') {
          return Promise.resolve(jsonResponse([aucklandCity, wellingtonCity]));
        }
        return Promise.resolve(jsonResponse([wellingtonArea, homeArea, otherArea]));
      }
      if (url.pathname.endsWith('/v1/achievements')) {
        return Promise.resolve(jsonResponse([communityReward]));
      }
      if (url.pathname.endsWith('/v1/users/me/profile')) {
        return Promise.resolve(jsonResponse(homeProfile));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderSection(true);

    expect(await screen.findByRole('heading', {
      name: 'Henderson-Massey has no active challenge this month',
    })).toBeInTheDocument();
  });

  it('labels the Auckland-first launch coverage honestly', async () => {
    stubApi(null);
    renderSection(false);

    expect(await screen.findByText('Auckland-first launch')).toBeInTheDocument();
    expect(screen.getByText(/Auckland local boards/)).toBeInTheDocument();
    // Anonymous visitors get the browse view without personalization.
    expect(await screen.findByText('Current challenge · Henderson-Massey'))
      .toBeInTheDocument();
    expect(screen.queryByText(/Your community/)).not.toBeInTheDocument();
    const regionSelect = screen.getByLabelText('Community');
    expect(within(regionSelect).getByRole('option', { name: 'Waitematā' }))
      .toBeInTheDocument();
  });

  it('excludes non-Auckland communities from the selector and the default view', async () => {
    const fetchMock = stubApi(null);
    renderSection(false);

    // Even though Wellington Central is listed first by the API, the guest
    // default is the first Auckland local board, never the out-of-bound one.
    expect(await screen.findByText('Current challenge · Henderson-Massey'))
      .toBeInTheDocument();

    const regionSelect = screen.getByLabelText('Community');
    await waitFor(() => {
      expect(within(regionSelect).getByRole('option', { name: 'Henderson-Massey' }))
        .toBeInTheDocument();
    });
    expect(within(regionSelect).getByRole('option', { name: 'Waitematā' }))
      .toBeInTheDocument();
    expect(within(regionSelect).queryByRole('option', { name: /Wellington/ }))
      .not.toBeInTheDocument();
    // No request is ever issued for the out-of-bound community.
    expect(challengeRequests(fetchMock).every((url) =>
      url.searchParams.get('regionId') !== wellingtonArea.id)).toBe(true);
  });

  it('keeps an out-of-boundary home community selectable and clearly labeled', async () => {
    stubApi({ ...homeProfile, homeCommunity: wellingtonArea });
    renderSection(true);

    // Truthful member behaviour: the member's verified actions genuinely
    // attribute to Wellington Central, so it stays visible — labeled.
    expect(await screen.findByText('Your community · Wellington Central'))
      .toBeInTheDocument();
    const regionSelect = screen.getByLabelText('Community');
    expect(within(regionSelect).getByRole('option', {
      name: 'Wellington Central (your home)',
    })).toBeInTheDocument();
    expect(regionSelect).toHaveClass('w-full', 'min-w-0', 'max-w-full');
    expect(screen.getByText(/sits outside the Auckland launch coverage/))
      .toBeInTheDocument();
    // The Auckland communities remain browseable alongside it.
    expect(within(regionSelect).getByRole('option', { name: 'Henderson-Massey' }))
      .toBeInTheDocument();
  });

  it('shows a bounded retry state when the signed-in profile query fails', async () => {
    const fetchMock = stubApi(homeProfile, { profileFails: true });
    renderSection(true);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Your profile could not be loaded');
    expect(within(alert).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    // Never presented as "no home community"…
    expect(screen.queryByText(/have not chosen a home community/))
      .not.toBeInTheDocument();
    // …and never silently defaulted to the first region: no challenge
    // request fires until the member explicitly picks a community.
    expect(await screen.findByRole('option', { name: 'Select a community…' }))
      .toBeInTheDocument();
    expect(challengeRequests(fetchMock)).toHaveLength(0);
  });
});
