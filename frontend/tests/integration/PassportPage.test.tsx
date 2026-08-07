import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
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
    coverImage: {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      imageUrl: '/images/quests/native-planting.svg',
      altText: 'Volunteers planting native trees',
    },
    status: 'Verified',
    method: 'CompletionCode',
    completedAtUtc: '2026-07-20T09:00:00.0000000Z',
    verifiedAtUtc: '2026-07-21T09:00:00.0000000Z',
    xpAmount: 50,
    achievementNames: ['First Step'],
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

function achievementCatalog() {
  return [{
    id: '11111111-1111-4111-8111-111111111111',
    code: 'verified-completions-1',
    name: 'First Steps',
    description: 'Complete one verified quest.',
    iconUrl: null,
    category: 'Milestone',
  }];
}

function achievementStats() {
  return achievementCatalog().map((item) => ({
    achievementId: item.id,
    nationwideEarnedCount: 0,
    nationwideMemberCount: 100,
    earnedPercentage: 0,
    rarity: 'Unawarded',
    calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
  }));
}

function achievementProfile(overrides: Record<string, unknown> = {}) {
  return {
    earnedDistinctCount: 0,
    activeAchievementCount: 45,
    trophy: {
      tier: 'Locked',
      requiredCount: 0,
      nextTier: 'Bronze',
      nextRequiredCount: 5,
      nationwideEarnedCount: 0,
      nationwideMemberCount: 100,
      earnedPercentage: 0,
      rarity: 'Unawarded',
      calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
    },
    cosmetics: {
      passportBorderStyle: null,
      avatarFrameStyle: null,
      badgeStampStyles: [],
    },
    ...overrides,
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
  catalog?: () => Promise<Response>;
  achievements?: () => Promise<Response>;
  achievementStats?: () => Promise<Response>;
  achievementProfile?: () => Promise<Response>;
  summary?: () => Promise<Response>;
  communityParticipation?: () => Promise<Response>;
}

function stubPassportApi({
  progression,
  completions,
  catalog,
  achievements,
  achievementStats: stats,
  achievementProfile: profile,
  summary,
  communityParticipation,
}: StubOptions) {
  const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    if (url.endsWith('/v1/users/me/progression')) {
      return progression?.() ?? Promise.resolve(jsonResponse(progressionPayload()));
    }
    if (url.includes('/v1/users/me/passport/completions')) {
      return completions?.(url) ?? Promise.resolve(jsonResponse(emptyHistory()));
    }
    if (url.endsWith('/v1/users/me/passport/community-participation')) {
      return communityParticipation?.() ?? Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/v1/users/me/passport')) {
      return summary?.() ?? Promise.resolve(jsonResponse({
        displayName: 'Aroha',
        totalXp: 120,
        level: 3,
        rankTitle: 'Novice',
        homeCommunity: null,
        verifiedCompletionCount: 1,
        selfReportedCompletionCount: 0,
        pendingCompletionCount: 0,
        categoryImpact: [{
          category: 'RestoreNature',
          verifiedCompletionCount: 1,
          verifiedXp: 50,
        }],
      }));
    }
    if (url.endsWith('/v1/achievements')) {
      return catalog?.() ?? Promise.resolve(jsonResponse(achievementCatalog()));
    }
    if (url.endsWith('/v1/achievement-stats')) {
      return stats?.() ?? Promise.resolve(jsonResponse(achievementStats()));
    }
    if (url.endsWith('/v1/users/me/achievements')) {
      return achievements?.() ?? Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/v1/users/me/achievement-profile')) {
      return profile?.()
        ?? Promise.resolve(jsonResponse(achievementProfile()));
    }
    if (url.endsWith('/v1/users/me/public-passport')) {
      return Promise.resolve(jsonResponse({
        isEnabled: false,
        shareId: null,
        featuredAchievementIds: [],
      }));
    }
    if (url.endsWith('/v1/users/me/profile')) {
      return Promise.resolve(jsonResponse({
        displayName: 'Aroha',
        homeCommunity: null,
        showCommunityOnPassport: false,
        communityChangeAvailableAtUtc: null,
      }));
    }
    if (url.endsWith('/v1/users/me/streak')) {
      return Promise.resolve(jsonResponse({
        currentWeeks: 2,
        hasVerifiedImpactThisWeek: true,
      }));
    }
    if (url.endsWith('/v1/users/me/claims')) {
      return Promise.resolve(jsonResponse([]));
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
    expect(screen.getByRole('heading', { name: 'Bronze trophy is next' }))
      .toBeInTheDocument();
    expect(screen.getByRole('progressbar', {
      name: '0 of 5 distinct achievements',
    })).toBeInTheDocument();
    expect(historyRegion().querySelector('ul')).not.toBeInTheDocument();
  });

  it('F5: renders the populated summary and history from server data', async () => {
    stubPassportApi({
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem()]))),
      achievementProfile: () => Promise.resolve(jsonResponse({
        ...achievementProfile(),
        earnedDistinctCount: 12,
        trophy: {
          tier: 'Silver',
          requiredCount: 10,
          nextTier: 'Gold',
          nextRequiredCount: 20,
          nationwideEarnedCount: 8,
          nationwideMemberCount: 240,
          earnedPercentage: 3.3333,
          rarity: 'Rare',
          calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
        },
        cosmetics: {
          passportBorderStyle: 'forest',
          avatarFrameStyle: 'sprout',
          badgeStampStyles: ['explorer'],
        },
      })),
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
    expect(screen.getByRole('heading', { name: 'Silver Trophy' }))
      .toBeInTheDocument();
    expect(screen.getByText(/8 members have reached Silver or higher/))
      .toBeInTheDocument();
    expect(screen.getByText(/3.33% · Rare/)).toBeInTheDocument();
    expect(container.querySelector('[data-passport-border="forest"]'))
      .toBeInTheDocument();
    expect(container.querySelector('[data-avatar-frame="sprout"]'))
      .toBeInTheDocument();
    expect(screen.getByText('Eco Explorer')).toBeInTheDocument();

    expect(screen.getAllByText('Restore Nature')).not.toHaveLength(0);
    expect(screen.getAllByText('Verified')).not.toHaveLength(0);
    expect(screen.getByText('50 XP')).toHaveClass(
      'border-amber-200',
      'bg-amber-50',
      'text-amber-700',
      'dark:border-amber-700',
      'dark:bg-amber-900/30',
      'dark:text-amber-300',
    );
    const xpProgress = screen.getByRole('progressbar', {
      name: 'Progress toward Level 4',
    });
    expect(xpProgress).toHaveClass('bg-base-300');
    expect(xpProgress.firstElementChild).toHaveClass(
      'bg-gradient-to-r',
      'from-primary',
      'to-emerald-400',
    );
    expect(screen.getByText('First Step')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Volunteers planting native trees' }))
      .toHaveAttribute('src', expect.stringContaining('images.unsplash.com'));
    expect(screen.getByRole('link', { name: 'Share' }))
      .toHaveAttribute(
        'href',
        '/passport/share/completion?completionId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      );
    expect(screen.getByRole('link', { name: 'Share' }))
      .toHaveClass('kiwi-share-action');
    expect(screen.getByRole('link', { name: 'View Quest' }))
      .toHaveAttribute('href', '/quests/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(historyRegion().querySelector('ul')?.className)
      .toContain('sm:grid-cols-2');
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
        Promise.resolve(jsonResponse(historyPage([completionItem({
          achievementNames: [],
          xpAmount: null,
        })]))),
    });
    renderPassport();

    const row = (await screen.findByText('Harbour restoration day')).closest('li');
    expect(row).toHaveTextContent('XP pending');
    expect(row?.textContent).not.toMatch(/\d+\s+XP/);
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
        Promise.resolve(jsonResponse({
          type: 'https://kiwimpact.app/problems/profile-not-found',
          title: 'Profile Not Found',
          status: 404,
        }, 404)),
    });
    renderPassport();

    await waitFor(() =>
      expect(summaryRegion()).toHaveTextContent('Passport unavailable'));
    expect(summaryRegion().querySelector('button')).not.toBeInTheDocument();
  });

  it('does not mislabel an unrelated 404 as a missing Passport profile', async () => {
    stubPassportApi({
      progression: () =>
        Promise.resolve(jsonResponse({ title: 'Not Found', status: 404 }, 404)),
    });
    renderPassport();

    await waitFor(() =>
      expect(summaryRegion()).toHaveTextContent('We could not load this section.'));
    expect(summaryRegion()).not.toHaveTextContent('Passport unavailable');
    expect(summaryRegion().querySelector('button')).toHaveTextContent('Retry');
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

  it.each([
    [
      'typed not-ready',
      NOT_READY_PROBLEM,
      503,
      'Your achievement trophy is being prepared. Try again shortly.',
    ],
    [
      'generic server failure',
      { title: 'Server error' },
      500,
      'We could not load this section.',
    ],
  ])(
    'isolates a %s from the rest of Passport and retries only the trophy profile',
    async (_caseName, problem, status, expectedMessage) => {
      const user = userEvent.setup();
      let profileAttempts = 0;
      const fetchMock = stubPassportApi({
        achievementProfile: () => {
          profileAttempts += 1;
          return Promise.resolve(
            profileAttempts === 1
              ? jsonResponse(problem, status)
              : jsonResponse(achievementProfile()),
          );
        },
        completions: () =>
          Promise.resolve(jsonResponse(historyPage([completionItem()]))),
      });
      renderPassport();

      expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
      expect(screen.getByText('20 / 65 XP toward Level 4')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Achievements' }))
        .toHaveTextContent('First Steps');
      expect(historyRegion()).toHaveTextContent('Harbour restoration day');

      const nonProfileCallsBefore = fetchMock.mock.calls.filter(([url]) =>
        !String(url).endsWith('/v1/users/me/achievement-profile')).length;
      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByRole('heading', {
        name: 'Bronze trophy is next',
      })).toBeInTheDocument();
      expect(fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith('/v1/users/me/achievement-profile')))
        .toHaveLength(2);
      expect(fetchMock.mock.calls.filter(([url]) =>
        !String(url).endsWith('/v1/users/me/achievement-profile')).length)
        .toBe(nonProfileCallsBefore);
    },
  );

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

  it('F19: keeps progression, history, achievements, and identity out of stores and Web Storage', async () => {
    stubPassportApi({
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem()]))),
    });
    renderPassport();
    await screen.findByText('Harbour restoration day');

    const storeState = JSON.stringify(useUiStore.getState());
    expect(storeState)
      .not.toMatch(/progression|passport|achievement|totalXp|rankTitle|displayName/i);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('F20: includes the accepted streak and privacy-safe Share Card domains', async () => {
    stubPassportApi({
      completions: () =>
        Promise.resolve(jsonResponse(historyPage([completionItem()]))),
    });
    const { container } = renderPassport();
    await screen.findByText('Harbour restoration day');

    expect(container.textContent).toMatch(/achievement/i);
    expect(container.textContent).toMatch(/streak|share.?card/i);
    expect(container.textContent).not.toMatch(/carbon/i);
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
    expect(screen.getByRole('link', { name: 'Share Passport' }))
      .toHaveAttribute('href', '/passport/share');
    expect(screen.getByRole('heading', { level: 2, name: 'Progress' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Achievements' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Completion history' }))
      .toBeInTheDocument();

    // Progressbar ARIA values in the unified within-level unit.
    const bar = screen.getByRole('progressbar', {
      name: 'Progress toward Level 4',
    });
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

    const completedStamp = screen.getByRole('img', {
      name: 'Mission complete, verified',
    });
    expect(completedStamp).toHaveClass('opacity-80');
    expect(completedStamp).toHaveTextContent('MISSION');
    expect(completedStamp).toHaveTextContent('COMPLETE');
    expect(completedStamp.querySelector('[data-stamp-mask="transparent-field"]'))
      .toBeInTheDocument();
    expect(completedStamp.querySelector('[data-stamp-seal="edge"]'))
      .toHaveAttribute('fill', 'currentColor');
    expect(completedStamp.querySelector('[data-stamp-field="transparent"]'))
      .toHaveAttribute('fill', 'none');
    expect(completedStamp.querySelector('[data-stamp-field="transparent"]'))
      .toHaveAttribute('stroke-width', '1.5');
    expect(completedStamp.querySelector('[data-stamp-line="mission-complete"]'))
      .toHaveAttribute('fill', 'white');
    expect(completedStamp.querySelector('[data-stamp-band="mission-complete"]'))
      .toHaveAttribute('fill', 'currentColor');
  });

  it('F22: uses stacked regions and the Figma responsive achievement grid', async () => {
    stubPassportApi({});
    const { container } = renderPassport();
    await screen.findByText('First Steps');

    const main = container.querySelector('main');
    expect(main?.className).toContain('kiwi-page-wide');
    expect(main?.querySelector('.md\\:grid-cols-3')).not.toBeInTheDocument();
    expect(summaryRegion().className).not.toContain('md:col-span-1');
    expect(historyRegion().className).not.toContain('md:col-span-2');
    const achievementGrid = screen.getByRole('region', { name: 'Achievements' })
      .querySelector('ul');
    expect(achievementGrid?.className).toContain('grid-cols-2');
    expect(achievementGrid?.className).toContain('sm:grid-cols-3');
    expect(achievementGrid?.className).toContain('lg:grid-cols-4');
  });

  it('F23: places Achievements between Progress and Completion history', async () => {
    stubPassportApi({});
    renderPassport();
    await screen.findByText('First Steps');

    const headings = screen.getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      'Progress',
      'Bronze trophy is next',
      'Quest category progress',
      'Achievements',
      'Community challenge participation',
      'Passport settings',
      'Share your Passport',
      'Completion history',
    ]);
  });

  it('uses the exact Figma category colours for Passport progress bars', async () => {
    stubPassportApi({});
    renderPassport();
    await screen.findByRole('heading', { name: 'Quest category progress' });

    const expectedColours = [
      ['Restore Nature', 'bg-[#2F8F5B]'],
      ['Protect Wildlife', 'bg-[#3C72C9]'],
      ['Clean & Reduce Waste', 'bg-[#C74444]'],
      ['Grow & Compost', 'bg-[#6C8F2F]'],
      ['Observe & Measure', 'bg-[#6C63D9]'],
      ['Learn & Share', 'bg-[#C963D9]'],
    ] as const;

    for (const [label, colourClass] of expectedColours) {
      expect(screen.getByRole('progressbar', { name: new RegExp(`^${label}:`) })
        .querySelector('span')?.className).toContain(colourClass);
    }
  });

  it('filters against the complete Passport history rather than only the visible page', async () => {
    const verified = completionItem();
    const selfReported = completionItem({
      completionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      questId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      questTitle: 'Waste-free habit',
      questCategory: 'CleanReduceWaste',
      status: 'SelfReported',
      method: 'SelfReported',
      verifiedAtUtc: null,
      xpAmount: null,
      achievementNames: [],
    });
    stubPassportApi({
      completions: (url) => Promise.resolve(jsonResponse(
        url.includes('pageSize=50')
          ? {
            items: [verified, selfReported],
            page: 1,
            pageSize: 50,
            totalCount: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          }
          : historyPage([verified]),
      )),
    });
    const user = userEvent.setup();
    renderPassport();

    await within(historyRegion()).findByText('Harbour restoration day');
    await user.click(screen.getByRole('button', { name: 'Self reported' }));

    expect(await within(historyRegion()).findByText('Waste-free habit')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {
      name: 'Filter completion history by Restore Nature',
    }));
    expect(await within(historyRegion()).findByText('No matching completions')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all' }));
    expect(await within(historyRegion()).findByText('Harbour restoration day')).toBeInTheDocument();
  });
});
