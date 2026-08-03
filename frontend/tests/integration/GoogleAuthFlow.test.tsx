import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import LoginPage from '../../src/pages/LoginPage.tsx';
import ProfileSettingsPage from '../../src/pages/ProfileSettingsPage.tsx';

vi.mock('../../src/components/community/CommunityProfileCard.tsx', () => ({
  default: () => <div>Community settings</div>,
}));

describe('Google authentication UI', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('offers Google sign-in and explains the explicit same-email link flow', () => {
    const { unmount } = renderRoute('/login', <LoginPage />);

    expect(screen.getByRole('link', { name: 'Continue with Google' }))
      .toHaveAttribute(
        'href',
        '/api/v1/auth/external-login/google?returnUrl=%2F',
      );
    unmount();

    renderRoute('/login?externalError=account_exists', <LoginPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sign in with your password, then link Google in Profile Settings.',
    );
  });

  it('shows linked Google state and hides password change for Google-only users', () => {
    renderSettings({
      hasPassword: false,
      linkedProviders: ['Google'],
    }, '/settings/profile?googleLinked=1');

    expect(screen.getByRole('status')).toHaveTextContent(
      'Google is linked to your account.',
    );
    expect(screen.getByRole('button', { name: 'Google linked' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Change password' }))
      .not.toBeInTheDocument();
    expect(screen.getByText(/has no local password/i)).toBeInTheDocument();
  });

  it('offers explicit linking and password change for a local account', () => {
    renderSettings({
      hasPassword: true,
      linkedProviders: [],
    });

    expect(screen.getByRole('button', { name: 'Link Google account' }))
      .toBeEnabled();
    expect(screen.getByRole('link', { name: 'Change password' }))
      .toHaveAttribute('href', '/settings/password');
  });
});

function renderSettings(
  methods: { hasPassword: boolean; linkedProviders: string[] },
  initialPath = '/settings/profile',
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authQueryKey, {
    userId: 'member-1',
    displayName: 'Aroha',
    email: 'member@example.test',
    roles: ['Member'],
    ...methods,
  });
  return renderRoute(initialPath, <ProfileSettingsPage />, queryClient);
}

function renderRoute(
  initialPath: string,
  element: React.ReactNode,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
  const router = createMemoryRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/settings/profile', element },
  ], { initialEntries: [initialPath] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
