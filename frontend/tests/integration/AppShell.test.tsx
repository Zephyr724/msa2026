import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

function stubSessionFetch(session: unknown) {
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
