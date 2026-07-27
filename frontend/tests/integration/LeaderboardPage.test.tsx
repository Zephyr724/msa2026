import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LeaderboardPage from '../../src/pages/LeaderboardPage.tsx';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils.tsx';

function payload(rows: unknown[] = [{
  rank: 1,
  displayName: 'Aroha',
  totalXp: 150,
  verifiedCompletionCount: 2,
}]) {
  return {
    scope: 'auckland',
    period: 'weekly',
    page: 1,
    pageSize: 10,
    totalCount: rows.length,
    isPrivacyProtected: false,
    collectiveProgress: null,
    rows,
  };
}

function stubApi(leaderboard: () => Promise<Response>) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/v1/leaderboards/people')) return leaderboard();
    if (url.endsWith('/v1/community-challenges')) {
      return Promise.resolve(jsonResponse([]));
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
      if (url.endsWith('/v1/community-challenges')) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse({ title: 'Unauthorized' }, 401));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Aroha');
    await user.click(screen.getByRole('tab', { name: 'Communities' }));
    expect(await screen.findByText('Albert-Eden')).toBeInTheDocument();
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
