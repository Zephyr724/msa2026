import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LeaderboardPage from '../../src/pages/LeaderboardPage.tsx';
import {
  createTestQueryClient,
  jsonResponse,
} from '../organizerTestUtils.tsx';

function payload(rows: unknown[] = [{
  rank: 1,
  displayName: 'Aroha with a deliberately long display name',
  totalXp: 150,
  verifiedCompletionCount: 2,
}]) {
  return { scope: 'nz', period: 'allTime', rows };
}

function renderPage(queryClient = createTestQueryClient()) {
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('LeaderboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the bounded loading state', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));

    renderPage();

    expect(screen.getByText('Loading the leaderboard…').parentElement)
      .toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders an honest empty state without a table', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse(payload([])))));

    renderPage();

    expect(await screen.findByText('No ranked members yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the exact semantic fixed-layout table', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse(payload()))));

    const { container } = renderPage();

    const table = await screen.findByRole('table', {
      name: 'New Zealand all-time people leaderboard',
    });
    expect(table).toHaveClass('table-fixed', 'w-full');
    const columns = container.querySelectorAll('colgroup col');
    expect(columns).toHaveLength(4);
    expect(columns[0]).toHaveClass('w-10', 'sm:w-14');
    expect(columns[2]).toHaveClass('w-16', 'sm:w-24');
    expect(columns[3]).toHaveClass('w-16', 'sm:w-24');
    for (const header of within(table).getAllByRole('columnheader')) {
      expect(header).toHaveAttribute('scope', 'col');
    }
    expect(screen.getByLabelText('Rank 1')).toHaveTextContent('1');
    const name = within(table).getByText('Aroha with a deliberately long display name');
    expect(name).toHaveClass('min-w-0', 'truncate');
    expect(name).toHaveAttribute(
      'title',
      'Aroha with a deliberately long display name',
    );
    expect(within(table).getByText('150')).toHaveClass('text-right');
    expect(within(table).getByText('2')).toHaveClass('text-right');
  });

  it('contains errors and retries without rendering server detail', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        type: 'https://kiwimpact.app/problems/leaderboard-not-ready',
        title: 'Leaderboard Not Ready',
        status: 503,
        detail: 'Sensitive server detail must stay hidden.',
      }, 503))
      .mockResolvedValueOnce(jsonResponse(payload()));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'We could not load the leaderboard. Please try again.',
    );
    expect(alert).not.toHaveTextContent('Sensitive server detail');
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reuses fresh cached data and refetches after prefix invalidation', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(payload())));
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = createTestQueryClient();
    const first = renderPage(queryClient);
    await screen.findByRole('table');
    expect(fetchMock).toHaveBeenCalledOnce();
    first.unmount();

    const second = renderPage(queryClient);
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();

    await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    second.unmount();
  });

  it('does not access Zustand or Web Storage for server data', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(jsonResponse(payload()))));

    renderPage();
    await screen.findByRole('table');

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
