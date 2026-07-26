import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PassportPage from '../../src/pages/PassportPage.tsx';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import { passportKeys } from '../../src/hooks/usePassportCompletions.ts';
import { resetCsrfToken } from '../../src/lib/api/apiFetch.ts';
import { useUiStore } from '../../src/stores/useUiStore.ts';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils.tsx';

const session = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

const NOT_READY_PROBLEM = {
  type: 'https://kiwimpact.app/problems/progression-not-ready',
  title: 'Progression Not Ready',
  status: 503,
  detail: 'Progression is not ready yet.',
};

function progressionPayload(overrides: Record<string, unknown> = {}) {
  return { totalXp: 120, level: 3, rankTitle: 'Novice', ...overrides };
}

function completionItem(overrides: Record<string, unknown> = {}) {
  return {
    completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    questId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    questTitle: 'Harbour restoration day',
    questCategory: 'RestoreNature',
    questStatus: 'Published',
    status: 'Verified',
    method: 'CompletionCode',
    completedAtUtc: '2026-07-20T09:00:00.0000000Z',
    verifiedAtUtc: '2026-07-21T09:00:00.0000000Z',
    xpAmount: 50,
    ...overrides,
  };
}

function emptyHistory() {
  return {
    items: [],
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function historyPage(
  items: unknown[],
  { page = 1, totalPages = 1 }: { page?: number; totalPages?: number } = {},
) {
  return {
    items,
    page,
    pageSize: 12,
    totalCount: totalPages === 0 ? 0 : items.length + (totalPages - 1),
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

interface StubOptions {
  progression?: () => Promise<Response>;
  completions?: (url: string) => Promise<Response>;
}

function stubPassportApi({ progression, completions }: StubOptions) {
  const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    if (url.endsWith('/v1/users/me/progression')) {
      return progression?.() ?? Promise.resolve(jsonResponse(progressionPayload()));
    }
    if (url.includes('/v1/users/me/passport/completions')) {
      return completions?.(url) ?? Promise.resolve(jsonResponse(emptyHistory()));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderPassport(queryClient = createTestQueryClient()) {
  queryClient.setQueryData(authQueryKey, session);
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PassportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

function summaryRegion() {
  return screen.getByRole('region', { name: 'Progress' });
}

function historyRegion() {
  return screen.getByRole('region', { name: 'Completion history' });
}

describe('PassportPage', () => {
  beforeEach(() => {
    resetCsrfToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('F3: shows loading skeletons for both regions', () => {
    stubPassportApi({
      progression: () => new Promise<Response>(() => {}),
      completions: () => new Promise<Response>(() => {}),
    });
    renderPassport();

    expect(screen.getByText('Loading your progress…')).toBeInTheDocument();
    expect(screen.getByText('Loading your completion history…')).toBeInTheDocument();
    expect(summaryRegion().querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(historyRegion().querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('F4: renders the empty Level 1 state and an honest empty history', async () => {
    stubPassportApi({
      progression: () =>
        Promise.resolve(jsonResponse(progressionPayload({ totalXp: 0, level: 1 }))),
    });
    renderPassport();

    expect(await screen.findByText('0 / 45 XP toward Level 2')).toBeInTheDocument();
    expect(screen.getByText('45 XP to Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('No verified completions yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discover quests' }))
      .toHaveAttribute('href', '/quests');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('F5: renders the populated summary and history from server data', async () => {
    stubPassportApi({
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem()]))),
    });
    const { container } = renderPassport();

    // Display name comes from the existing session query, not a fetch.
    expect(await screen.findByRole('heading', { name: 'Aroha — Passport' }))
      .toBeInTheDocument();
    expect(await screen.findByText('Harbour restoration day')).toBeInTheDocument();
    expect(await screen.findByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('Novice')).toBeInTheDocument();
    expect(screen.getByText(/Total XP:/)).toBeInTheDocument();
    expect(screen.getByText('120 XP')).toBeInTheDocument();
    expect(screen.getByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(screen.getByText('45 XP to Level 4')).toBeInTheDocument();

    expect(screen.getByText('RestoreNature')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('50 XP')).toBeInTheDocument();
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('dateTime', '2026-07-20T09:00:00.0000000Z');
  });

  it('F15: renders the exact-threshold boundary state from the server level', async () => {
    stubPassportApi({
      progression: () =>
        Promise.resolve(jsonResponse(progressionPayload({ totalXp: 100, level: 3 }))),
    });
    renderPassport();

    expect(await screen.findByText('0 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(screen.getByText('65 XP to Level 4')).toBeInTheDocument();
  });

  it('F15: renders the Level 99 maximum state without an XP-to-next line', async () => {
    stubPassportApi({
      progression: () =>
        Promise.resolve(jsonResponse(progressionPayload({
          totalXp: 51_940,
          level: 99,
          rankTitle: 'Kiwimpact Legend',
        }))),
    });
    renderPassport();

    expect(await screen.findByText('Maximum level reached')).toBeInTheDocument();
    expect(screen.getByText('Level 99')).toBeInTheDocument();
    expect(screen.getByText('Kiwimpact Legend')).toBeInTheDocument();
    expect(screen.queryByText(/XP to Level/)).not.toBeInTheDocument();
    expect(screen.queryByText(/toward Level/)).not.toBeInTheDocument();
  });

  it('F16: labels an ordinary reward-pending row as XP pending, never an estimate', async () => {
    stubPassportApi({
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem({ xpAmount: null })]))),
    });
    renderPassport();

    const row = (await screen.findByText('Harbour restoration day')).closest('li');
    expect(row).toHaveTextContent('XP pending');
    expect(row?.textContent).not.toMatch(/\d+\s*XP/);
  });

  it('F11: degrades only the summary on a progression 503, with a working retry', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const fetchMock = stubPassportApi({
      progression: () => {
        attempts += 1;
        return Promise.resolve(
          attempts === 1
            ? jsonResponse(NOT_READY_PROBLEM, 503)
            : jsonResponse(progressionPayload()),
        );
      },
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem()]))),
    });
    renderPassport();

    // Ordinary history still renders while the summary shows the not-ready panel.
    expect(await screen.findByText('Harbour restoration day')).toBeInTheDocument();
    expect(summaryRegion())
      .toHaveTextContent('Your progress is being prepared. Try again shortly.');
    expect(historyRegion())
      .not.toHaveTextContent('being prepared');

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/v1/users/me/progression'))).toHaveLength(2);
  });

  it('F12: shows the history-region not-ready state on a history 503, summary unaffected', async () => {
    stubPassportApi({
      completions: () => Promise.resolve(jsonResponse(NOT_READY_PROBLEM, 503)),
    });
    renderPassport();

    expect(await screen.findByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(historyRegion())
      .toHaveTextContent('Your completion history is being prepared. Try again shortly.');
    expect(summaryRegion()).not.toHaveTextContent('being prepared');
  });

  it('F13: shows "Passport unavailable" on a missing-profile 404', async () => {
    stubPassportApi({
      progression: () =>
        Promise.resolve(jsonResponse({ title: 'Not Found', status: 404 }, 404)),
    });
    renderPassport();

    await waitFor(() =>
      expect(summaryRegion()).toHaveTextContent('Passport unavailable'));
    expect(summaryRegion().querySelector('button')).not.toBeInTheDocument();
  });

  it('F14: shows a generic per-region error with Retry on an unexpected 500', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const fetchMock = stubPassportApi({
      progression: () => {
        attempts += 1;
        return Promise.resolve(
          attempts === 1
            ? jsonResponse({ title: 'Server error' }, 500)
            : jsonResponse(progressionPayload()),
        );
      },
      completions: () => Promise.resolve(jsonResponse({ title: 'Server error' }, 500)),
    });
    renderPassport();

    await waitFor(() =>
      expect(summaryRegion()).toHaveTextContent('We could not load this section.'));
    expect(historyRegion()).toHaveTextContent('We could not load this section.');

    const retryButtons = screen.getAllByRole('button', { name: 'Retry' });
    expect(retryButtons).toHaveLength(2);
    await user.click(retryButtons[0]!);
    expect(await screen.findByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/v1/users/me/progression'))).toHaveLength(2);
  });

  it('F17: resets the history view to page 1 on a redemption-driven invalidation', async () => {
    const user = userEvent.setup();
    const pageOneItem = completionItem({ questTitle: 'First page quest' });
    const pageTwoItem = completionItem({
      completionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      questTitle: 'Second page quest',
    });
    stubPassportApi({
      completions: (url) => {
        const page = new URL(url, 'http://test').searchParams.get('page');
        return Promise.resolve(jsonResponse(
          page === '2'
            ? historyPage([pageTwoItem], { page: 2, totalPages: 2 })
            : historyPage([pageOneItem], { page: 1, totalPages: 2 }),
        ));
      },
    });
    const { queryClient } = renderPassport();

    await user.click(await screen.findByRole('button', { name: 'Go to next page' }));
    expect(await screen.findByText('Second page quest')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    // The redemption resync invalidates ['passport'] (asserted in
    // tests/unit/useCompletion.test.tsx); the view returns to page 1.
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: passportKeys.all });
    });

    expect(await screen.findByText('First page quest')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('F18: clamps to the last page when a refetch returns fewer pages', async () => {
    const user = userEvent.setup();
    let shrunk = false;
    stubPassportApi({
      completions: (url) => {
        const page = new URL(url, 'http://test').searchParams.get('page');
        if (shrunk) {
          return Promise.resolve(jsonResponse(historyPage(
            [completionItem({ questTitle: 'Remaining quest' })],
            { page: 1, totalPages: 1 },
          )));
        }
        return Promise.resolve(jsonResponse(
          page === '2'
            ? historyPage([completionItem({ questTitle: 'Second page quest' })], { page: 2, totalPages: 2 })
            : historyPage([completionItem()], { page: 1, totalPages: 2 }),
        ));
      },
    });
    const { queryClient } = renderPassport();

    await user.click(await screen.findByRole('button', { name: 'Go to next page' }));
    expect(await screen.findByText('Second page quest')).toBeInTheDocument();

    // A background refetch (not a redemption invalidation) reports one page.
    shrunk = true;
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: passportKeys.all });
    });

    expect(await screen.findByText('Remaining quest')).toBeInTheDocument();
    expect(screen.queryByText('Page 2 of 2')).not.toBeInTheDocument();
  });

  it('F19: keeps progression, history, and identity out of stores and Web Storage', async () => {
    stubPassportApi({
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem()]))),
    });
    renderPassport();
    await screen.findByText('Harbour restoration day');

    const storeState = JSON.stringify(useUiStore.getState());
    expect(storeState).not.toMatch(/progression|passport|totalXp|rankTitle|displayName/i);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('F20: contains no achievement, streak, leaderboard, share-card, or carbon text', async () => {
    stubPassportApi({
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem()]))),
    });
    const { container } = renderPassport();
    await screen.findByText('Harbour restoration day');

    expect(container.textContent)
      .not.toMatch(/achievement|streak|leaderboard|share.?card|carbon/i);
  });

  it('F21: meets the accessibility contract', async () => {
    const user = userEvent.setup();
    stubPassportApi({
      completions: (url) => {
        const page = new URL(url, 'http://test').searchParams.get('page');
        return Promise.resolve(jsonResponse(
          page === '2'
            ? historyPage([completionItem()], { page: 2, totalPages: 2 })
            : historyPage([completionItem()], { page: 1, totalPages: 2 }),
        ));
      },
    });
    const { container } = renderPassport();
    await screen.findByText('Harbour restoration day');

    // Single h1 followed by h2 section headings.
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Aroha — Passport');
    expect(screen.getByRole('heading', { level: 2, name: 'Progress' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Completion history' }))
      .toBeInTheDocument();

    // Progressbar ARIA values in the unified within-level unit.
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '65');
    expect(bar).toHaveAttribute('aria-valuenow', '20');

    // Named, keyboard-operable pagination buttons.
    const next = screen.getByRole('button', { name: 'Go to next page' });
    const previous = screen.getByRole('button', { name: 'Go to previous page' });
    expect(previous).toBeDisabled();
    next.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();

    // Dates use <time dateTime>.
    expect(container.querySelector('time'))
      .toHaveAttribute('dateTime', '2026-07-20T09:00:00.0000000Z');
  });

  it('F22: keeps the responsive hierarchy classes (single column mobile, two-column desktop)', async () => {
    stubPassportApi({});
    const { container } = renderPassport();
    await screen.findByRole('heading', { name: 'Aroha — Passport' });

    const main = container.querySelector('main');
    expect(main?.className).toContain('max-w-4xl');
    const grid = main?.querySelector('.grid');
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-3');
    expect(summaryRegion().className).toContain('md:col-span-1');
    expect(historyRegion().className).toContain('md:col-span-2');
  });
});
