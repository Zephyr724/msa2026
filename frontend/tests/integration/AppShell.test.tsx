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

    expect(screen.getByRole('heading', { name: 'Kiwimpact' })).toBeInTheDocument();
    expect(
      screen.getByText('Community eco quests across New Zealand'),
    ).toBeInTheDocument();
    const questsLink = screen.getByRole('link', { name: 'Quests' });
    expect(within(questsLink).getByText('Quests')).toHaveClass('hidden sm:inline');
    const leaderboardLink = screen.getByRole('link', { name: 'Leaderboard' });
    expect(leaderboardLink).toHaveAttribute('href', '/leaderboard');
    expect(within(leaderboardLink).getByText('Leaderboard'))
      .toHaveClass('hidden sm:inline');
    const themeSwitcher = screen.getByRole('button', {
      name: 'Theme preference: System',
    });
    expect(within(themeSwitcher).getByText('System')).toHaveClass('hidden lg:inline');
    const signInLink = await screen.findByRole('link', { name: 'Sign in' });
    expect(within(signInLink).getByText('Sign in')).toHaveClass('hidden sm:inline');
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
      expect(within(manageLink).getByText('Manage quests')).toHaveClass('hidden sm:inline');

      const leaderboardLink = screen.getByRole('link', { name: 'Leaderboard' });
      expect(within(leaderboardLink).getByText('Leaderboard'))
        .toHaveClass('hidden sm:inline');

      const passportLink = screen.getByRole('link', { name: 'Passport' });
      expect(within(passportLink).getByText('Passport')).toHaveClass('hidden sm:inline');

      expect(screen.getAllByRole('button', { name: 'Theme preference: System' }))
        .toHaveLength(1);

      const signOut = screen.getByRole('button', { name: 'Sign out' });
      expect(within(signOut).getByText('Sign out')).toHaveClass('hidden sm:inline');
    },
  );

  it('does not render the management item for a Member', async () => {
    stubSessionFetch(sessionWith(['Member']));
    render(<App />);

    await screen.findByRole('link', { name: 'Passport' });
    expect(screen.getByRole('link', { name: 'Leaderboard' }))
      .toHaveAttribute('href', '/leaderboard');
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
      if (url.endsWith('/v1/leaderboards/people')) {
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
    await user.click(screen.getByRole('link', { name: 'Leaderboard' }));

    expect(await screen.findByRole('heading', { name: 'Leaderboard' }))
      .toBeInTheDocument();
    expect(screen.getByText('No ranked members yet.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
