import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Outlet } from 'react-router-dom';
import RequireManagementAccess from '../../src/components/organizer/RequireManagementAccess';
import { authQueryKey } from '../../src/hooks/useAuth';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import OrganizerQuestListPage from '../../src/pages/OrganizerQuestListPage';
import { createTestQueryClient, jsonResponse, renderWithRouter } from '../organizerTestUtils';

describe('Organizer management access', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('redirects anonymous sessions to login', async () => {
    const client = createTestQueryClient();
    client.setQueryData(authQueryKey, null);
    renderGuard(client);
    await waitFor(() => expect(screen.getByText('Login destination')).toBeInTheDocument());
  });

  it('shows the unavailable fallback to Members', () => {
    const client = createTestQueryClient();
    client.setQueryData(authQueryKey, session(['Member']));
    renderGuard(client);
    expect(screen.getByRole('heading', { name: 'Management unavailable' })).toBeInTheDocument();
  });

  it.each(['Organizer', 'Admin'])('allows %s sessions', (role) => {
    const client = createTestQueryClient();
    client.setQueryData(authQueryKey, session([role]));
    renderGuard(client);
    expect(screen.getByText('Management content')).toBeInTheDocument();
  });

  it('redirects a mid-session management API 401 to login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    renderManagementList();
    await waitFor(() => expect(screen.getByText('Login destination')).toBeInTheDocument());
  });

  it('renders the forbidden state for a management API 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ detail: 'Forbidden' }, 403),
    ));
    renderManagementList();
    expect(await screen.findByRole('heading', { name: 'Management unavailable' })).toBeInTheDocument();
  });
});

function renderGuard(queryClient: ReturnType<typeof createTestQueryClient>) {
  return renderWithRouter([
    {
      element: <Outlet />,
      children: [
        {
          element: <RequireManagementAccess />,
          children: [{ path: '/organizer/quests', element: <p>Management content</p> }],
        },
        { path: '/login', element: <p>Login destination</p> },
      ],
    },
  ], '/organizer/quests', queryClient);
}

function renderManagementList() {
  return renderWithRouter([
    { path: '/organizer/quests', element: <OrganizerQuestListPage /> },
    { path: '/login', element: <p>Login destination</p> },
  ], '/organizer/quests');
}

function session(roles: string[]) {
  return {
    userId: 'user-1',
    displayName: 'Aroha',
    email: 'aroha@example.test',
    roles,
  };
}
