import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import ShareCardBuilderPage from '../../src/pages/ShareCardBuilderPage.tsx';
import {
  createTestQueryClient,
  jsonResponse,
} from '../organizerTestUtils.tsx';

// jsdom Image never fires onload, so the SVG rasterization path is mocked;
// loaderState.fail simulates a decode failure (fallback vector art).
const loaderState = vi.hoisted(() => ({ fail: false }));
vi.mock('../../src/lib/svgImageLoader.ts', () => ({
  loadSvgImage: vi.fn(() =>
    Promise.resolve(loaderState.fail ? null : ({} as HTMLImageElement))),
}));

const verified = {
  completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  questId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  questTitle: 'Harbour restoration day',
  questCategory: 'RestoreNature',
  questStatus: 'Published',
  coverImage: null,
  status: 'Verified',
  method: 'CompletionCode',
  completedAtUtc: '2026-07-20T09:00:00.0000000Z',
  verifiedAtUtc: '2026-07-21T09:00:00.0000000Z',
  xpAmount: 50,
  achievementNames: ['First Step'],
};

const selfReported = {
  ...verified,
  completionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  questId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  questTitle: 'Private garden reflection',
  status: 'SelfReported',
  method: 'SelfReported',
  verifiedAtUtc: null,
  xpAmount: null,
  achievementNames: [],
};

// Matches the strict achievement-profile validator: 5 distinct earned
// achievements maps to the Bronze tier with Silver next.
const achievementProfile = {
  earnedDistinctCount: 5,
  activeAchievementCount: 3,
  trophy: {
    tier: 'Bronze',
    requiredCount: 5,
    nextTier: 'Silver',
    nextRequiredCount: 10,
    nationwideEarnedCount: 40,
    nationwideMemberCount: 100,
    earnedPercentage: 40,
    rarity: 'Common',
    calculatedAtUtc: '2026-07-21T09:00:00Z',
  },
  cosmetics: {
    passportBorderStyle: null,
    avatarFrameStyle: null,
    badgeStampStyles: [],
  },
};

const earnedAchievements = [
  {
    achievementId: '99999999-9999-4999-8999-999999999999',
    code: 'FIRST-STEP',
    name: 'First Step',
    description: 'Completed a first verified quest.',
    iconUrl: null,
    category: 'Quests',
    awardedAt: '2026-07-20T09:00:00Z',
  },
];

function installCanvasMock() {
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({
    createLinearGradient: vi.fn(() => gradient),
    measureText: vi.fn((value: string) => ({ width: value.length * 20 })),
  } as unknown as CanvasRenderingContext2D, {
    get(target, property) {
      if (property in target) return target[property as keyof typeof target];
      return vi.fn();
    },
    set(target, property, value) {
      Reflect.set(target, property, value);
      return true;
    },
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => context);
}

function renderPage(
  items: unknown[],
  initialEntry = '/passport/share',
  options: {
    profileStatus?: 'ok' | 'error' | 'pending';
    achievementsStatus?: 'ok' | 'pending';
  } = {},
) {
  const profileStatus = options.profileStatus ?? 'ok';
  const achievementsStatus = options.achievementsStatus ?? 'ok';
  installCanvasMock();
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/users/me/progression')) {
      return Promise.resolve(jsonResponse({
        totalXp: 120,
        level: 3,
        rankTitle: 'Novice',
      }));
    }
    if (url.endsWith('/v1/users/me/achievement-profile')) {
      if (profileStatus === 'pending') {
        return new Promise<Response>(() => {});
      }
      if (profileStatus === 'error') {
        return Promise.resolve(jsonResponse({ detail: 'Profile failed.' }, 500));
      }
      return Promise.resolve(jsonResponse(achievementProfile));
    }
    if (url.endsWith('/v1/users/me/achievements')) {
      if (achievementsStatus === 'pending') {
        return new Promise<Response>(() => {});
      }
      return Promise.resolve(jsonResponse(earnedAchievements));
    }
    if (url.includes('/v1/users/me/passport/completions')) {
      const requestUrl = new URL(url, 'http://localhost');
      const page = Number(requestUrl.searchParams.get('page') ?? '1');
      const pageSize = Number(requestUrl.searchParams.get('pageSize') ?? '50');
      const start = (page - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize);
      const totalPages = items.length === 0
        ? 0
        : Math.ceil(items.length / pageSize);
      return Promise.resolve(jsonResponse({
        items: pageItems,
        page,
        pageSize,
        totalCount: items.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }));
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
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ShareCardBuilderPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShareCardBuilderPage', () => {
  afterEach(() => {
    loaderState.fail = false;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('offers only verified records and updates accessible visual controls', async () => {
    const user = userEvent.setup();
    renderPage([verified, selfReported]);

    expect(await screen.findByRole('heading', { name: 'Share Card Builder' }))
      .toBeInTheDocument();
    expect(await screen.findByText('Harbour restoration day')).toBeInTheDocument();
    expect(screen.queryByText('Private garden reflection')).not.toBeInTheDocument();
    expect(screen.getByRole('img', {
      name: 'Share Card preview for Harbour restoration day',
    })).toHaveAttribute('width', '1080');
    expect(screen.getByText(/Home Community or precise location/))
      .toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ocean' }));
    expect(screen.getByRole('button', { name: 'Ocean' }))
      .toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(screen.getByRole('button', { name: 'Light' }))
      .toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('checkbox', { name: /Show display name/ }));
    expect(screen.getByRole('checkbox', { name: /Show display name/ })).toBeChecked();
  });

  it('shows an honest empty state when no verified record exists', async () => {
    renderPage([selfReported]);

    expect(await screen.findByText('Complete a verified Quest first'))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open My Quests/ }))
      .toHaveAttribute('href', '/my-quests');
    expect(screen.queryByRole('button', { name: 'Download PNG' }))
      .not.toBeInTheDocument();
  });

  it('opens on the verified completion selected by the Passport deep link', async () => {
    const selected = {
      ...verified,
      completionId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      questId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      questTitle: 'Selected stream restoration',
    };

    const firstPage = Array.from({ length: 50 }, (_, index) => ({
      ...verified,
      completionId: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      questId: `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      questTitle: `Earlier verified completion ${index + 1}`,
    }));

    renderPage(
      [...firstPage, selected],
      `/passport/share?completionId=${selected.completionId}`,
    );

    expect(await screen.findByRole('radio', {
      name: 'Selected stream restoration',
    })).toBeChecked();
    expect(screen.getByRole('img', {
      name: 'Share Card preview for Selected stream restoration',
    })).toBeInTheDocument();
  });

  it('shows the current trophy artwork and the completion achievement badges', async () => {
    renderPage([verified, selfReported]);

    expect(await screen.findByRole('img', {
      name: 'Bronze achievement trophy',
    })).toBeInTheDocument();
    expect(screen.getByText('Bronze Trophy')).toBeInTheDocument();
    expect(screen.getByText('Common')).toBeInTheDocument();
    // The badge art appears in the chooser next to the verified completion
    // that earned "First Step".
    expect(screen.getAllByRole('img', {
      name: 'First Step badge, earned',
    }).length).toBeGreaterThan(0);
  });

  it('shows a truthful loading state while the trophy profile is fetched', async () => {
    renderPage([verified], '/passport/share', { profileStatus: 'pending' });

    expect(await screen.findByText('Harbour restoration day'))
      .toBeInTheDocument();
    expect(screen.getByText('Loading trophy…')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /achievement trophy/ }))
      .not.toBeInTheDocument();
  });

  it('keeps the card usable with a truthful note when the trophy profile fails', async () => {
    renderPage([verified], '/passport/share', { profileStatus: 'error' });

    expect(await screen.findByText(/Trophy unavailable/)).toBeInTheDocument();
    expect(screen.getByRole('img', {
      name: 'Share Card preview for Harbour restoration day',
    })).toBeInTheDocument();
  });

  it('still renders the card when artwork decoding fails', async () => {
    loaderState.fail = true;
    renderPage([verified]);

    expect(await screen.findByRole('img', {
      name: 'Bronze achievement trophy',
    })).toBeInTheDocument();
    expect(screen.getByRole('img', {
      name: 'Share Card preview for Harbour restoration day',
    })).toBeInTheDocument();
  });

  it('blocks export while the achievement profile is still pending', async () => {
    renderPage([verified], '/passport/share', { profileStatus: 'pending' });

    expect(await screen.findByText('Loading trophy…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download PNG/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
    expect(screen.getByText('Preparing trophy and badge artwork…')).toBeInTheDocument();
  });

  it('blocks export while earned-achievement resolution is pending', async () => {
    renderPage([verified], '/passport/share', { achievementsStatus: 'pending' });

    expect(await screen.findByText('Harbour restoration day')).toBeInTheDocument();
    await waitFor(() => expect(
      screen.getByRole('button', { name: /Download PNG/ }),
    ).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
  });

  it('enables export once the profile and artwork settle', async () => {
    renderPage([verified]);

    await waitFor(() => expect(
      screen.getByRole('button', { name: /Download PNG/ }),
    ).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
  });

  it('keeps export available with the truthful fallback when the profile query fails', async () => {
    renderPage([verified], '/passport/share', { profileStatus: 'error' });

    expect(await screen.findByText(/Trophy unavailable/)).toBeInTheDocument();
    await waitFor(() => expect(
      screen.getByRole('button', { name: /Download PNG/ }),
    ).toBeEnabled());
  });

  it('keeps export available with vector fallbacks when artwork decoding fails', async () => {
    loaderState.fail = true;
    renderPage([verified]);

    await waitFor(() => expect(
      screen.getByRole('button', { name: /Download PNG/ }),
    ).toBeEnabled());
  });
});
