import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.tsx';
import { queryClient } from '../../src/app/queryClient.ts';
import { jsonResponse } from '../organizerTestUtils.tsx';

function sessionWith(roles: string[]) {
  return {
    userId: 'user-nav',
    displayName: 'Navigator',
    email: 'nav@example.test',
    roles,
  };
}

function trophyProfile(tier: 'Locked' | 'Bronze' = 'Locked') {
  const bronze = tier === 'Bronze';
  return {
    earnedDistinctCount: bronze ? 5 : 0,
    activeAchievementCount: 45,
    trophy: {
      tier,
      requiredCount: bronze ? 5 : 0,
      nextTier: bronze ? 'Silver' : 'Bronze',
      nextRequiredCount: bronze ? 10 : 5,
      nationwideEarnedCount: bronze ? 12 : 0,
      nationwideMemberCount: 240,
      earnedPercentage: bronze ? 5 : 0,
      rarity: bronze ? 'Rare' : 'Unawarded',
      calculatedAtUtc: '2026-07-30T00:00:00.0000000Z',
    },
    cosmetics: {
      passportBorderStyle: null,
      avatarFrameStyle: null,
      badgeStampStyles: [],
    },
  };
}

function stubSessionFetch(
  session: unknown,
  profileResponse: () => Promise<Response> = () =>
    Promise.resolve(jsonResponse(trophyProfile())),
) {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    if (url.endsWith('/v1/auth/me')) {
      return Promise.resolve(jsonResponse(session));
    }
    if (url.endsWith('/v1/users/me/progression')) {
      return Promise.resolve(jsonResponse({
        totalXp: 120,
        level: 3,
        rankTitle: 'Novice',
      }));
    }
    if (url.endsWith('/v1/users/me/achievement-profile')) {
      return profileResponse();
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  }));
}

describe('App shell', () => {
  afterEach(() => {
    queryClient.clear();
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('renders the public home page and signed-out navigation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    render(<App />);

    expect(screen.getByRole('heading', {
      name: /Kiwimpact.*Turn local action into lasting progress/i,
    })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Discover eco quests near you, get verified, earn XP, and build your Impact Passport/i,
      ),
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: 'Discover' })) {
      expect(link).toHaveAttribute('href', '/quests');
    }
    for (const link of screen.getAllByRole('link', { name: 'Leaderboard' })) {
      expect(link).toHaveAttribute('href', '/leaderboard');
    }
    expect(await screen.findByRole('navigation', { name: 'Public navigation' }))
      .toBeInTheDocument();
    const themeSwitcher = screen.getByRole('button', {
      name: 'Theme preference: System',
    });
    expect(themeSwitcher).toBeInTheDocument();
    const signInLink = await screen.findByRole('link', { name: 'Sign in' });
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  // Review 39 M1: the complete authenticated cluster — including the
  // management item — must fit at 320/375px using the existing
  // compact-label idiom (icon + `hidden sm:inline` label + aria-label).
  it.each(['Organizer', 'Admin'])(
    'compacts the %s navigation cluster below the sm breakpoint',
    async (role) => {
      stubSessionFetch(sessionWith([role]));
      render(<App />);

      const manageLink = await screen.findByRole('link', { name: 'Manage quests' });
      expect(manageLink).toHaveAttribute('href', '/organizer/quests');
      expect(within(manageLink).getByText('Manage')).toHaveClass('hidden xl:inline');

      expect(screen.getAllByRole('link', { name: 'Leaderboard' }))
        .toHaveLength(2);

      expect(screen.getAllByRole('link', { name: 'Passport' }))
        .toHaveLength(2);
      expect(screen.getByRole('navigation', { name: 'Member navigation' }))
        .toBeInTheDocument();

      expect(screen.getAllByRole('button', { name: 'Theme preference: System' }))
        .toHaveLength(1);

      const signOut = screen.getByRole('button', { name: 'Sign out' });
      expect(signOut).toHaveClass('btn-square');

      if (role === 'Admin') {
        const reviewLink = screen.getByRole('link', { name: 'Review evidence' });
        expect(reviewLink).toHaveAttribute('href', '/admin/reviews');
        expect(reviewLink).toHaveClass('btn-square');
        expect(within(reviewLink).getByText('Review')).toHaveClass('hidden sm:inline');
      }
    },
  );

  it('does not render the management item for a Member', async () => {
    stubSessionFetch(sessionWith(['Member']));
    render(<App />);

    expect(await screen.findAllByRole('link', { name: 'Passport' }))
      .toHaveLength(2);
    for (const link of screen.getAllByRole('link', { name: 'Leaderboard' })) {
      expect(link).toHaveAttribute('href', '/leaderboard');
    }
    expect(screen.getByRole('button', { name: 'Theme preference: System' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage quests' })).not.toBeInTheDocument();
  });

  it('shows a lit trophy beside the authenticated navigation name', async () => {
    stubSessionFetch(
      sessionWith(['Member']),
      () => Promise.resolve(jsonResponse(trophyProfile('Bronze'))),
    );
    const { container } = render(<App />);

    const trophy = await waitForElement(
      () => container.querySelector('[data-nav-trophy="Bronze"]'),
    );
    expect(await screen.findAllByText('Navigator')).not.toHaveLength(0);
    expect(trophy).toHaveAttribute(
      'title',
      'Bronze Trophy · 12 nationwide · 5% · Rare',
    );
  });

  it('keeps navigation usable when the trophy profile is unavailable', async () => {
    stubSessionFetch(
      sessionWith(['Member']),
      () => Promise.resolve(jsonResponse({ title: 'Server error' }, 500)),
    );
    const { container } = render(<App />);

    expect(await screen.findAllByText('Navigator')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Sign out' }))
      .toBeInTheDocument();
    expect(container.querySelector('[data-nav-trophy]')).not.toBeInTheDocument();
  });

  it('serves the leaderboard route publicly without a login redirect', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) {
        return Promise.resolve(new Response(null, { status: 401 }));
      }
      if (url.includes('/v1/leaderboards/people?')) {
        return Promise.resolve(jsonResponse({
          scope: 'nz',
          period: 'allTime',
          rows: [],
        }));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    }));
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getAllByRole('link', { name: 'Leaderboard' })[0]!);

    expect(await screen.findByRole('heading', { name: 'Leaderboard' }))
      .toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'No ranked members yet.' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});

async function waitForElement<T extends Element>(
  read: () => T | null,
): Promise<T> {
  let element: T | null = null;
  await waitFor(() => {
    element = read();
    expect(element).not.toBeNull();
  });
  return element!;
}
