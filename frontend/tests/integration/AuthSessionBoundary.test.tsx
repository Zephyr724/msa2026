import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import AppShell from '../../src/app/AppShell.tsx';
import RequireAuth from '../../src/components/RequireAuth.tsx';
import PassportPage from '../../src/pages/PassportPage.tsx';
import { authQueryKey, useLoginMutation } from '../../src/hooks/useAuth.ts';
import { resetCsrfToken } from '../../src/lib/api/apiFetch.ts';
import { jsonResponse } from '../organizerTestUtils.tsx';

// Review 39 M2: these tests use a FRESH QueryClient installed through
// QueryClientProvider. The production API modules receive the active client
// explicitly from `useQueryClient()` in the hooks, so the call-order and
// non-repopulation assertions below prove the B1 lifecycle acts on the
// provider's client — not on any module-level singleton (none is imported
// here).

const sessionA = {
  userId: 'user-a',
  displayName: 'Aroha',
  email: 'a@example.test',
  roles: ['Member'],
};

const sessionB = {
  userId: 'user-b',
  displayName: 'Mika',
  email: 'b@example.test',
  roles: ['Member'],
};

function historyWith(title: string) {
  return {
    items: [{
      completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      questId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      questTitle: title,
      questCategory: 'RestoreNature',
      questStatus: 'Published',
      coverImage: null,
      status: 'Verified',
      method: 'CompletionCode',
      completedAtUtc: '2026-07-20T09:00:00.0000000Z',
      verifiedAtUtc: '2026-07-21T09:00:00.0000000Z',
      xpAmount: 50,
      achievementNames: ['First Step'],
    }],
    page: 1,
    pageSize: 12,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

const EXPECTED_CLEANUP_ORDER = [
  'cancel:progression',
  'cancel:passport',
  'cancel:achievements',
  'remove:progression',
  'remove:passport',
  'remove:achievements',
  'setAuth',
];

/** Records the private cleanup and auth-entry call order on the live client. */
function trackOrder(client: QueryClient, order: string[]) {
  const origCancel = client.cancelQueries.bind(client);
  const origRemove = client.removeQueries.bind(client);
  const origSet = client.setQueryData.bind(client);
  vi.spyOn(client, 'cancelQueries').mockImplementation((filters) => {
    const first = (filters?.queryKey as readonly unknown[] | undefined)?.[0];
    if (first === 'progression' || first === 'passport' || first === 'achievements') {
      order.push(`cancel:${String(first)}`);
    }
    return origCancel(filters);
  });
  vi.spyOn(client, 'removeQueries').mockImplementation((filters) => {
    const first = (filters?.queryKey as readonly unknown[] | undefined)?.[0];
    if (first === 'progression' || first === 'passport' || first === 'achievements') {
      order.push(`remove:${String(first)}`);
    }
    origRemove(filters);
  });
  vi.spyOn(client, 'setQueryData').mockImplementation(((key: unknown, data: unknown, options: unknown) => {
    if (Array.isArray(key) && key[0] === 'auth') {
      order.push('setAuth');
    }
    return origSet(key as never, data as never, options as never);
  }) as never);
}

function privateCacheEntries(client: QueryClient) {
  return client.getQueryCache().findAll()
    .filter((query) =>
      ['progression', 'passport', 'achievements']
        .includes(String(query.queryKey[0])));
}

/**
 * Concurrent-401 invariant: every recorded auth write must be preceded by a
 * complete cancel-then-remove of both private prefixes, no matter how the
 * concurrent cleanup runs interleave.
 */
function expectEveryAuthWritePrecededByFullCleanup(order: string[]) {
  const setAuthIndexes = order
    .map((entry, index) => (entry === 'setAuth' ? index : -1))
    .filter((index) => index >= 0);
  expect(setAuthIndexes.length).toBeGreaterThan(0);
  for (const index of setAuthIndexes) {
    const before = order.slice(0, index);
    for (const required of EXPECTED_CLEANUP_ORDER.slice(0, 6)) {
      expect(before).toContain(required);
    }
  }
}

function LoginHarness() {
  const login = useLoginMutation();
  return (
    <button
      onClick={() => login.mutate({ email: 'b@example.test', password: 'ValidPass!1234' })}
      type="button"
    >
      B sign in
    </button>
  );
}

describe('authenticated-cache lifecycle at principal boundaries', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    resetCsrfToken();
    queryClient = new QueryClient();
  });

  afterEach(() => {
    resetCsrfToken();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    queryClient.clear();
  });

  it('F9: concurrent mid-page private 401s cancel and remove private queries before clearing the session', async () => {
    const order: string[] = [];
    trackOrder(queryClient, order);
    // Both private reads observe 401 in the same window: the cleanup must
    // stay idempotent and ordered on the active provider client.
    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(sessionA));
      if (url.endsWith('/v1/users/me/progression')) {
        return Promise.resolve(jsonResponse({ detail: 'Authentication required.' }, 401));
      }
      if (url.includes('/v1/users/me/passport/completions')) {
        return Promise.resolve(jsonResponse({ detail: 'Authentication required.' }, 401));
      }
      if (url.endsWith('/v1/achievements')) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.endsWith('/v1/users/me/achievements')) {
        return Promise.resolve(jsonResponse({ detail: 'Authentication required.' }, 401));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    });
    vi.stubGlobal('fetch', fetchMock);

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

    // The 401 handler does not complete before cleanup; the guard redirects
    // only after the auth entry is null.
    expect(await screen.findByText('Sign in page')).toBeInTheDocument();
    await waitFor(() => expect(queryClient.getQueryData(authQueryKey)).toBeNull());
    expectEveryAuthWritePrecededByFullCleanup(order);
    expect(privateCacheEntries(queryClient)).toHaveLength(0);
  });

  it('F10: logout and login run cleanup before the session changes; nothing of A survives for B', async () => {
    const order: string[] = [];
    trackOrder(queryClient, order);

    let resolveProgressionA: (response: Response) => void = () => undefined;
    const deferredProgressionA = new Promise<Response>((resolve) => {
      resolveProgressionA = resolve;
    });
    let principal: 'A' | 'B' = 'A';

    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'csrf-boundary' }));
      }
      if (url.endsWith('/v1/auth/me')) {
        return Promise.resolve(jsonResponse(principal === 'A' ? sessionA : sessionB));
      }
      if (url.endsWith('/v1/auth/logout')) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.endsWith('/v1/auth/login')) {
        return Promise.resolve(jsonResponse(sessionB));
      }
      if (url.endsWith('/v1/users/me/progression')) {
        return principal === 'A'
          ? deferredProgressionA
          : Promise.resolve(jsonResponse({ totalXp: 60, level: 2, rankTitle: 'Novice' }));
      }
      if (url.includes('/v1/users/me/passport/completions')) {
        return Promise.resolve(jsonResponse(
          principal === 'A'
            ? historyWith('Aroha river clean-up')
            : historyWith('Kauri planting morning'),
        ));
      }
      if (url.endsWith('/v1/achievements')) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.endsWith('/v1/users/me/achievements')) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    });
    vi.stubGlobal('fetch', fetchMock);

    const router = createMemoryRouter([
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <p>Home page</p> },
          { path: '/login', element: <LoginHarness /> },
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

    // A's history renders; A's progression request is still in flight.
    expect(await screen.findByText('Aroha river clean-up')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    // Logout awaits the cleanup before the auth entry becomes null.
    await waitFor(() => expect(queryClient.getQueryData(authQueryKey)).toBeNull());
    expect(order).toEqual(EXPECTED_CLEANUP_ORDER);
    expect(privateCacheEntries(queryClient)).toHaveLength(0);

    // A's deferred progression request resolving after logout must NOT
    // repopulate the cache (cancelled before removal).
    resolveProgressionA(jsonResponse({ totalXp: 51_940, level: 99, rankTitle: 'Kiwimpact Legend' }));
    await act(async () => undefined);
    expect(privateCacheEntries(queryClient)).toHaveLength(0);

    // B signs in: account replacement shares the same strict order.
    order.length = 0;
    principal = 'B';
    await act(async () => {
      await router.navigate('/login');
    });
    await user.click(await screen.findByRole('button', { name: 'B sign in' }));
    await waitFor(() => expect(queryClient.getQueryData(authQueryKey)).toEqual(sessionB));
    expect(order).toEqual(EXPECTED_CLEANUP_ORDER);

    await act(async () => {
      await router.navigate('/passport');
    });

    // B renders only B's fetched data; nothing of A remains.
    expect(await screen.findByText('Kauri planting morning')).toBeInTheDocument();
    expect(await screen.findByText('15 / 55 XP toward Level 3')).toBeInTheDocument();
    expect(screen.queryByText('Aroha river clean-up')).not.toBeInTheDocument();
    expect(screen.queryByText(/Kiwimpact Legend/)).not.toBeInTheDocument();
    expect(screen.queryByText(/51,940|51940/)).not.toBeInTheDocument();
  });
});
