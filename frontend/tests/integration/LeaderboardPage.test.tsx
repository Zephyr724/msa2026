import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LeaderboardPage from '../../src/pages/LeaderboardPage.tsx';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils.tsx';

function payload(
  rows: unknown[] = [{
  rank: 1,
  displayName: 'Aroha',
  totalXp: 150,
  verifiedCompletionCount: 2,
  isCurrentUser: true,
  }],
  currentUser: unknown = null,
) {
  return {
    scope: 'auckland',
    period: 'weekly',
    page: 1,
    pageSize: 10,
    totalCount: rows.length,
    isPrivacyProtected: false,
    collectiveProgress: null,
    currentUser,
    rows,
  };
}

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

function stubApi(leaderboard: () => Promise<Response>) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/v1/leaderboards/people')) return leaderboard();
    if (url.includes('/v1/community-challenges')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.includes('/v1/regions')) {
      // The community section derives the Auckland boundary from the
      // AdministrativeArea listing before offering LocalAreas.
      if (url.includes('type=AdministrativeArea')) {
        return Promise.resolve(jsonResponse([aucklandCity]));
      }
      return Promise.resolve(jsonResponse([localArea]));
    }
    if (url.endsWith('/v1/auth/me')) {
      return Promise.resolve(jsonResponse({ title: 'Unauthorized' }, 401));
    }
    return Promise.resolve(jsonResponse({ title: 'Unexpected' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderPage(queryClient = createTestQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><LeaderboardPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LeaderboardPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders a bounded loading state', () => {
    stubApi(() => new Promise<Response>(() => {}));
    renderPage();
    expect(screen.getByLabelText('Loading leaderboard')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders an honest empty state', async () => {
    stubApi(() => Promise.resolve(jsonResponse(payload([]))));
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'No ranked members yet.' }),
    ).toBeInTheDocument();
  });

  it('renders verified people standings', async () => {
    stubApi(() => Promise.resolve(jsonResponse(payload())));
    renderPage();
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Aroha')).toBeInTheDocument();
    expect(within(table).getByText('150')).toHaveClass('text-right');
    expect(within(table).getByText('2')).toHaveClass('text-right');
    expect(within(table).getByText('You')).toBeInTheDocument();
    expect(within(table).getByRole('row', { current: true })).toHaveClass('bg-primary/8');
    expect(screen.getByRole('group', { name: 'Period' }))
      .toHaveClass('kiwi-segmented-primary');
    expect(screen.getByRole('group', { name: 'Scope' }))
      .not.toHaveClass('kiwi-segmented-primary');
  });

  it('shows progress without a wider-scope CTA below the 80th percentile', async () => {
    stubApi(() => Promise.resolve(jsonResponse(payload(undefined, {
      rank: 27,
      activeMemberCount: 127,
      totalXp: 150,
      verifiedCompletionCount: 2,
      surpassedMemberCount: 100,
      percentile: 79.37,
      hasReachedScopeUpgradeThreshold: false,
    }))));
    renderPage();

    expect(await screen.findByRole('heading', {
      name: 'You surpassed 100 active members',
    })).toBeInTheDocument();
    expect(screen.getByText(/0.63 percentage points/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try New Zealand' }))
      .not.toBeInTheDocument();
  });

  it('offers but does not automatically switch to the wider scope at 80 percent', async () => {
    const fetchMock = stubApi(() => Promise.resolve(jsonResponse(payload(undefined, {
      rank: 2,
      activeMemberCount: 6,
      totalXp: 250,
      verifiedCompletionCount: 4,
      surpassedMemberCount: 4,
      percentile: 80,
      hasReachedScopeUpgradeThreshold: true,
    }))));
    const user = userEvent.setup();
    renderPage();

    const cta = await screen.findByRole('button', { name: 'Try New Zealand' });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('scope=nz')))
      .toBe(false);
    await user.click(cta);
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('scope=nz')))
        .toBe(true);
    });
  });

  it('does not unlock from a display percentile rounded up to 80', async () => {
    stubApi(() => Promise.resolve(jsonResponse(payload(undefined, {
      rank: 4002,
      activeMemberCount: 20001,
      totalXp: 50,
      verifiedCompletionCount: 1,
      surpassedMemberCount: 15999,
      percentile: 80,
      hasReachedScopeUpgradeThreshold: false,
    }))));
    renderPage();

    await screen.findByRole('heading', { name: 'You surpassed 15999 active members' });
    expect(screen.queryByRole('button', { name: 'Try New Zealand' }))
      .not.toBeInTheDocument();
  });

  it('defaults an authenticated member with a Home Community to weekly community scope', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) {
        return Promise.resolve(jsonResponse({
          userId: '11111111-1111-4111-8111-111111111111',
          displayName: 'Aroha',
          email: 'aroha@example.test',
          roles: ['Member'],
        }));
      }
      if (url.endsWith('/v1/users/me/profile')) {
        return Promise.resolve(jsonResponse({
          displayName: 'Aroha',
          homeCommunity: {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Henderson-Massey',
            type: 'LocalArea',
            parentRegionId: '33333333-3333-4333-8333-333333333333',
          },
          showCommunityOnPassport: true,
          communityChangeAvailableAtUtc: null,
        }));
      }
      if (url.includes('/v1/leaderboards/people')) {
        return Promise.resolve(jsonResponse(payload([], null)));
      }
      if (url.endsWith('/v1/community-challenges')) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve(jsonResponse({ title: 'Unexpected' }, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) =>
        String(url).includes('scope=myCommunity&period=weekly'))).toBe(true);
    });
    expect(screen.getByRole('button', { name: /Henderson-Massey/ }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to the communities leaderboard', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/leaderboards/people')) {
        return Promise.resolve(jsonResponse(payload()));
      }
      if (url.includes('/v1/leaderboards/communities')) {
        return Promise.resolve(jsonResponse({
          scope: 'auckland',
          period: 'monthly',
          rows: [{
            rank: 1,
            regionId: '11111111-1111-4111-8111-111111111111',
            regionName: 'Albert-Eden',
            verifiedCompletionCount: 24,
            activeContributors: 12,
            completionsPerContributor: 2,
            isPrivacyProtected: false,
          }],
        }));
      }
      if (url.includes('/v1/community-challenges')) return Promise.resolve(jsonResponse([]));
      if (url.includes('/v1/regions')) {
        if (url.includes('type=AdministrativeArea')) {
          return Promise.resolve(jsonResponse([aucklandCity]));
        }
        return Promise.resolve(jsonResponse([localArea]));
      }
      return Promise.resolve(jsonResponse({ title: 'Unauthorized' }, 401));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Aroha');
    await user.click(screen.getByRole('tab', { name: 'Communities' }));
    expect((await screen.findAllByText('Albert-Eden')).length).toBeGreaterThanOrEqual(2);
  });

  it('contains server errors and retries', async () => {
    let attempts = 0;
    stubApi(() => {
      attempts++;
      return Promise.resolve(attempts === 1
        ? jsonResponse({ detail: 'Sensitive detail' }, 503)
        : jsonResponse(payload()));
    });
    const user = userEvent.setup();
    renderPage();
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent('Sensitive detail');
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect((await screen.findAllByText('Aroha')).length).toBeGreaterThan(0);
  });

  it('refetches after leaderboard prefix invalidation', async () => {
    const fetchMock = stubApi(() => Promise.resolve(jsonResponse(payload())));
    const client = createTestQueryClient();
    renderPage(client);
    await screen.findAllByText('Aroha');
    const before = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/leaderboards/people')).length;
    await client.invalidateQueries({ queryKey: ['leaderboard'] });
    await waitFor(() => {
      const after = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/leaderboards/people')).length;
      expect(after).toBe(before + 1);
    });
  });
});
