import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../src/App.tsx';
import { queryClient } from '../../src/app/queryClient.ts';

describe('App shell', () => {
  afterEach(() => {
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('renders the public home page and signed-out navigation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Kiwimpact' })).toBeInTheDocument();
    expect(
      screen.getByText('Community eco quests across New Zealand'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument());
  });
});
