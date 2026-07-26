import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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

function stubApi(participations: unknown[] = [activeQuest]) {
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
    expect(await screen.findByText('Dated Stream Cleanup')).toBeInTheDocument();
    expect(screen.getByText('Active mission')).toBeInTheDocument();
    expect(screen.getByText('Level 3 · Novice')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) =>
      String(url).endsWith('/v1/users/me/participations?status=active'))).toBe(true);
  });

  it('keeps the selected status in the URL and refetches that server filter', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi([]);
    const { router } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Cancelled' }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('?status=cancelled');
      expect(fetchMock.mock.calls.some(([url]) =>
        String(url).endsWith('/v1/users/me/participations?status=cancelled'))).toBe(true);
    });
    expect(await screen.findByText('No cancelled quests')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Discover quests/ }))
      .toHaveAttribute('href', '/quests');
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
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    }));
    const user = userEvent.setup();
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load your Mission Board');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Your Mission Board is ready')).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
