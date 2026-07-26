import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import RequireAuth from '../../src/components/RequireAuth.tsx';
import PassportPage from '../../src/pages/PassportPage.tsx';
import { resetCsrfToken } from '../../src/lib/api/apiFetch.ts';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils.tsx';

const session = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

const progression = { totalXp: 0, level: 1, rankTitle: 'Novice' };

const emptyHistory = {
  items: [],
  page: 1,
  pageSize: 12,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const PRIVATE_URLS = ['/v1/users/me/progression', '/v1/users/me/passport/completions'];

function privateCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(([url]) =>
    PRIVATE_URLS.some((suffix) => String(url).includes(suffix)));
}

function renderGuardedPassport(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter([
    {
      element: <Outlet />,
      children: [
        { path: '/login', element: <p>Sign in page</p> },
        {
          element: <RequireAuth />,
          children: [{ path: '/passport', element: <PassportPage /> }],
        },
      ],
    },
  ], { initialEntries: ['/passport'] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { queryClient, router };
}

describe('RequireAuth guard (F6/F7/F8)', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('F6: redirects a confirmed-anonymous session to /login without firing private fetches', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) {
        return Promise.resolve(jsonResponse({ detail: 'Authentication required.' }, 401));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    });
    renderGuardedPassport(fetchMock);

    // Pending state first: skeleton, no redirect yet.
    expect(screen.getByText('Checking your session…')).toBeInTheDocument();

    expect(await screen.findByText('Sign in page')).toBeInTheDocument();
    expect(screen.queryByText('Checking your session…')).not.toBeInTheDocument();
    expect(privateCalls(fetchMock)).toHaveLength(0);
  });

  it('F7: shows a bounded error with Retry on session-restore failure and never redirects', async () => {
    const user = userEvent.setup();
    let sessionAttempts = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) {
        sessionAttempts += 1;
        return Promise.resolve(
          sessionAttempts === 1
            ? jsonResponse({ title: 'Unavailable' }, 500)
            : jsonResponse(session),
        );
      }
      if (url.endsWith('/v1/users/me/progression')) {
        return Promise.resolve(jsonResponse(progression));
      }
      if (url.includes('/v1/users/me/passport/completions')) {
        return Promise.resolve(jsonResponse(emptyHistory));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    });
    renderGuardedPassport(fetchMock);

    expect(
      await screen.findByRole('heading', { name: 'We could not restore your session' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Sign in page')).not.toBeInTheDocument();
    expect(privateCalls(fetchMock)).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Aroha — Passport' }))
      .toBeInTheDocument();
    await waitFor(() => expect(privateCalls(fetchMock).length).toBe(2));
  });

  it('F8: renders children for an authenticated session and fires private fetches only then', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) {
        return Promise.resolve(jsonResponse(session));
      }
      if (url.endsWith('/v1/users/me/progression')) {
        return Promise.resolve(jsonResponse(progression));
      }
      if (url.includes('/v1/users/me/passport/completions')) {
        return Promise.resolve(jsonResponse(emptyHistory));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    });
    renderGuardedPassport(fetchMock);

    expect(await screen.findByRole('heading', { name: 'Aroha — Passport' }))
      .toBeInTheDocument();
    expect(screen.queryByText('Sign in page')).not.toBeInTheDocument();
    await waitFor(() => expect(privateCalls(fetchMock).length).toBe(2));
  });
});
