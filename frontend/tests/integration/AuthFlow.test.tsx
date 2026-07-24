import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import AppShell from '../../src/app/AppShell.tsx';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import { resetCsrfToken } from '../../src/lib/api/apiFetch.ts';
import LoginPage from '../../src/pages/LoginPage.tsx';
import RegisterPage from '../../src/pages/RegisterPage.tsx';
import { useUiStore } from '../../src/stores/useUiStore.ts';

describe('authentication frontend flow', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders anonymous and authenticated shell navigation from /auth/me', async () => {
    const anonymousFetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', anonymousFetch);
    const anonymous = renderShell();

    expect(screen.getByText('Checking session…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument();
    anonymous.unmount();

    const authenticatedFetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(session))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-logout' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', authenticatedFetch);
    renderShell();

    await waitFor(() => expect(screen.getByText('Aroha')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument());
    expect(authenticatedFetch).toHaveBeenCalledTimes(3);
  });

  it('keeps public navigation available when session restoration fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ title: 'Unavailable' }, 500),
    ));
    renderShell();

    await waitFor(() => expect(screen.getByText(/could not restore your session/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('validates login locally and stores a successful session only in TanStack Query', async () => {
    const user = userEvent.setup();
    const { queryClient } = renderAuthPage('/login');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email and password.');

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-login' }))
      .mockResolvedValueOnce(jsonResponse(session));
    vi.stubGlobal('fetch', fetchMock);
    await user.type(screen.getByLabelText('Email'), 'member@example.test');
    await user.type(screen.getByLabelText(/^Password/), 'ValidPass!1234');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Signed in destination')).toBeInTheDocument());
    expect(queryClient.getQueryData(authQueryKey)).toEqual(session);
    expect(useUiStore.getState()).not.toHaveProperty('user');
    expect(useUiStore.getState()).not.toHaveProperty('auth');
    expect(localStorage.length).toBe(0);
  });

  it('shows generic invalid-credential and rate-limit login errors', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-login' }))
      .mockResolvedValueOnce(jsonResponse({ title: 'Invalid credentials' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    const first = renderAuthPage('/login');

    await fillLogin(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'The email or password is incorrect.',
    ));
    first.unmount();

    resetCsrfToken();
    fetchMock.mockReset()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-login-two' }))
      .mockResolvedValueOnce(jsonResponse({}, 429));
    renderAuthPage('/login');
    await fillLogin(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(
      'Too many sign-in attempts',
    ));
  });

  it('validates registration and submits the allowlisted registration shape', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-register' }))
      .mockResolvedValueOnce(jsonResponse(session, 201));
    vi.stubGlobal('fetch', fetchMock);
    renderAuthPage('/register');

    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Complete every field.');

    await user.type(screen.getByLabelText('Display name'), 'Aroha');
    await user.type(screen.getByLabelText('Email'), 'member@example.test');
    await user.type(screen.getByLabelText(/^Password/), 'ValidPass!1234');
    await user.type(screen.getByLabelText('Confirm password'), 'ValidPass!1234');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(screen.getByText('Registration destination')).toBeInTheDocument());
    const submitted = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as Record<string, unknown>;
    expect(submitted).toEqual({
      displayName: 'Aroha',
      email: 'member@example.test',
      password: 'ValidPass!1234',
      passwordConfirmation: 'ValidPass!1234',
    });
    expect(submitted).not.toHaveProperty('role');
  });
});

const session = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderShell() {
  const queryClient = createQueryClient();
  const router = createMemoryRouter([
    {
      element: <AppShell />,
      children: [{ path: '/', element: <p>Public content</p> }],
    },
  ]);
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function renderAuthPage(initialPath: '/login' | '/register') {
  const queryClient = createQueryClient();
  const router = createMemoryRouter([
    {
      element: <Outlet />,
      children: [
        { path: '/login', element: initialPath === '/register'
          ? <p>Registration destination</p>
          : <LoginPage /> },
        { path: '/register', element: <RegisterPage /> },
        { path: '/', element: <p>Signed in destination</p> },
      ],
    },
  ], { initialEntries: [initialPath] });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}

async function fillLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'member@example.test');
  await user.type(screen.getByLabelText('Password'), 'ValidPass!1234');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
