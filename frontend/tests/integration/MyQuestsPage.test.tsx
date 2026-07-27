import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import MyQuestsPage from '../../src/pages/MyQuestsPage.tsx';
import {
  createTestQueryClient,
  jsonResponse,
} from '../organizerTestUtils.tsx';

const session = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

const activeQuest = {
  participationId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  status: 'Active',
  joinedAtUtc: '2026-07-25T00:00:00Z',
  cancelledAtUtc: null,
  quest: {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    title: 'Dated Stream Cleanup',
    description: 'Restore a local stream.',
    category: 'CleanReduceWaste',
    sourceType: 'OrganizerOwned',
    registrationMode: 'Native',
    difficulty: 'Easy',
    xpAward: 50,
    capacity: 30,
    startAtUtc: '2026-08-01T00:00:00Z',
    endAtUtc: null,
    locationRegion: null,
    locationDescription: 'Oakley Creek',
    coverImage: null,
  },
};

function renderPage(initialEntry = '/my-quests') {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authQueryKey, session);
  const router = createMemoryRouter(
    [{ path: '/my-quests', element: <MyQuestsPage /> }],
    { initialEntries: [initialEntry] },
  );
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, queryClient, router };
}

function stubApi(
  participations: unknown[] = [activeQuest],
  claims: unknown[] = [],
) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/users/me/progression')) {
      return Promise.resolve(jsonResponse({
        totalXp: 120,
        level: 3,
        rankTitle: 'Novice',
      }));
    }
    if (url.includes('/v1/users/me/participations')) {
      return Promise.resolve(jsonResponse(participations));
    }
    if (url.endsWith('/v1/users/me/claims')) {
      return Promise.resolve(jsonResponse(claims));
    }
    if (url.includes('/v1/users/me/passport/completions')) {
      return Promise.resolve(jsonResponse({
        items: [],
        page: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      }));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('MyQuestsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders server-owned participation data and player status', async () => {
    const fetchMock = stubApi();
    renderPage('/my-quests?status=active');

    expect(await screen.findByRole('heading', { name: 'Mission Board' }))
      .toBeInTheDocument();
    expect((await screen.findAllByText('Dated Stream Cleanup')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Active · starts/)).toBeInTheDocument();
    expect(screen.getByText('Level 3 · Novice')).toBeInTheDocument();
    expect(screen.getByText('Next milestone')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent achievements' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Passport preview' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) =>
      String(url).endsWith('/v1/users/me/participations?status=all'))).toBe(true);
  });

  it('keeps the composed view in the URL without refetching another user scope', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi([]);
    const { router } = renderPage();

    await user.click(screen.getByRole('button', { name: /Cancelled/ }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('?view=cancelled');
      expect(fetchMock.mock.calls.some(([url]) =>
        String(url).endsWith('/v1/users/me/participations?status=all'))).toBe(true);
    });
    expect(await screen.findByText('No cancelled Quests')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Discover Quests/ }))
      .toHaveAttribute('href', '/quests');
  });

  it('uses the latest claim when a rejected attempt is resubmitted for review', async () => {
    const user = userEvent.setup();
    const readyQuest = {
      ...activeQuest,
      quest: {
        ...activeQuest.quest,
        startAtUtc: '2020-01-01T00:00:00Z',
      },
    };
    const latestPending = {
      claimId: '11111111-1111-4111-8111-111111111111',
      userId: session.userId,
      questId: activeQuest.quest.id,
      questTitle: activeQuest.quest.title,
      status: 'Pending',
      completedAtUtc: '2026-07-26T10:00:00Z',
      createdAtUtc: '2026-07-26T10:00:00Z',
      reviewedAtUtc: null,
    };
    const olderRejected = {
      ...latestPending,
      claimId: '22222222-2222-4222-8222-222222222222',
      status: 'Rejected',
      createdAtUtc: '2026-07-25T10:00:00Z',
      reviewedAtUtc: '2026-07-25T12:00:00Z',
    };
    stubApi([readyQuest], [latestPending, olderRejected]);
    renderPage('/my-quests?view=ready');

    expect(await screen.findByText('Nothing ready to complete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Under Review.*1/ }))
      .toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Under Review.*1/ }));
    expect((await screen.findAllByText('Dated Stream Cleanup')).length).toBeGreaterThan(0);
    expect(screen.getByText('Under review')).toBeInTheDocument();
  });

  it('keeps schedule-TBD and future Quests active and only past starts ready', async () => {
    const user = userEvent.setup();
    const scheduleTbd = {
      ...activeQuest,
      participationId: '11111111-aaaa-4111-8111-111111111111',
      quest: {
        ...activeQuest.quest,
        id: '11111111-bbbb-4111-8111-111111111111',
        title: 'Schedule TBD Quest',
        startAtUtc: null,
      },
    };
    const future = {
      ...activeQuest,
      participationId: '22222222-aaaa-4222-8222-222222222222',
      quest: {
        ...activeQuest.quest,
        id: '22222222-bbbb-4222-8222-222222222222',
        title: 'Future Quest',
        startAtUtc: '2099-01-01T00:00:00Z',
      },
    };
    const past = {
      ...activeQuest,
      participationId: '33333333-aaaa-4333-8333-333333333333',
      quest: {
        ...activeQuest.quest,
        id: '33333333-bbbb-4333-8333-333333333333',
        title: 'Past Quest',
        startAtUtc: '2020-01-01T00:00:00Z',
      },
    };
    stubApi([scheduleTbd, future, past]);
    renderPage();

    const missionList = (await screen.findByRole('heading', { name: 'Your quests' }))
      .closest('section');
    expect(missionList).not.toBeNull();
    const missions = within(missionList!);
    expect(await screen.findByText('Schedule TBD Quest')).toBeInTheDocument();
    expect(screen.getByText('Future Quest')).toBeInTheDocument();
    expect(missions.queryByText('Past Quest')).not.toBeInTheDocument();
    expect(screen.getByText('Active · schedule to be confirmed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Active.*2/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ready to Complete.*1/ }));
    expect(await missions.findByText('Past Quest')).toBeInTheDocument();
    expect(missions.queryByText('Schedule TBD Quest')).not.toBeInTheDocument();
    expect(missions.queryByText('Future Quest')).not.toBeInTheDocument();
  });

  it('loads every Passport page before classifying an older completed Quest', async () => {
    const completedQuest = {
      ...activeQuest,
      quest: {
        ...activeQuest.quest,
        startAtUtc: '2020-01-01T00:00:00Z',
      },
    };
    const firstPageItems = Array.from({ length: 50 }, (_, index) => ({
      completionId: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      questId: `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      questTitle: `Other completed Quest ${index}`,
      questCategory: 'RestoreNature',
      questStatus: 'Published',
      status: 'Verified',
      method: 'CompletionCode',
      completedAtUtc: '2026-07-20T09:00:00.0000000Z',
      verifiedAtUtc: '2026-07-20T09:00:00.0000000Z',
      xpAmount: 50,
    }));
    const olderCompletedItem = {
      completionId: '30000000-0000-4000-8000-000000000000',
      questId: activeQuest.quest.id,
      questTitle: activeQuest.quest.title,
      questCategory: 'CleanReduceWaste',
      questStatus: 'Published',
      status: 'Verified',
      method: 'CompletionCode',
      completedAtUtc: '2025-01-01T09:00:00.0000000Z',
      verifiedAtUtc: '2025-01-01T09:00:00.0000000Z',
      xpAmount: 50,
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/users/me/progression')) {
        return Promise.resolve(jsonResponse({
          totalXp: 120,
          level: 3,
          rankTitle: 'Novice',
        }));
      }
      if (url.includes('/v1/users/me/participations')) {
        return Promise.resolve(jsonResponse([completedQuest]));
      }
      if (url.endsWith('/v1/users/me/claims')) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.includes('/v1/users/me/passport/completions')) {
        const page = new URL(url, 'http://localhost').searchParams.get('page');
        const items = page === '2' ? [olderCompletedItem] : firstPageItems;
        return Promise.resolve(jsonResponse({
          items,
          page: page === '2' ? 2 : 1,
          pageSize: 50,
          totalCount: 51,
          totalPages: 2,
          hasNextPage: page !== '2',
          hasPreviousPage: page === '2',
        }));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage('/my-quests?view=ready');

    expect(await screen.findByText('Nothing ready to complete')).toBeInTheDocument();
    expect(screen.queryByText('Dated Stream Cleanup')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) =>
      String(url).includes('page=2&pageSize=50'))).toBe(true);
  });

  it('contains an API failure and offers an explicit retry', async () => {
    let attempts = 0;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/users/me/progression')) {
        return Promise.resolve(jsonResponse({
          totalXp: 120,
          level: 3,
          rankTitle: 'Novice',
        }));
      }
      if (url.includes('/v1/users/me/participations')) {
        attempts += 1;
        return Promise.resolve(
          attempts === 1
            ? jsonResponse({ title: 'Server error' }, 500)
            : jsonResponse([]),
        );
      }
      if (url.endsWith('/v1/users/me/claims')) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.includes('/v1/users/me/passport/completions')) {
        return Promise.resolve(jsonResponse({
          items: [],
          page: 1,
          pageSize: 50,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    }));
    const user = userEvent.setup();
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not classify your Mission Board');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No upcoming active missions')).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
