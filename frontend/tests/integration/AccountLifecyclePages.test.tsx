import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmEmailPage } from '../../src/pages/AccountLifecyclePages';
import { jsonResponse } from '../organizerTestUtils';

describe('ConfirmEmailPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('confirms once in StrictMode and restores plus characters in the token', async () => {
    const requests: Array<{ url: string; body?: string }> = [];
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, body: typeof init?.body === 'string' ? init.body : undefined });
      if (url.endsWith('/v1/auth/csrf-token')) {
        return Promise.resolve(jsonResponse({ token: 'csrf-token' }));
      }
      if (url.endsWith('/v1/auth/confirm-email')) {
        return Promise.resolve(jsonResponse({ message: 'Email confirmed.' }));
      }
      return Promise.resolve(jsonResponse({ title: 'Unexpected request' }, 500));
    }));

    render(
      <StrictMode>
        <MemoryRouter
          initialEntries={['/confirm-email?userId=member-id&token=abc+def/ghi==']}
        >
          <Routes>
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    );

    expect(await screen.findByText('Email confirmed.')).toBeInTheDocument();
    await waitFor(() => {
      const confirmations = requests.filter((request) =>
        request.url.endsWith('/v1/auth/confirm-email'));
      expect(confirmations).toHaveLength(1);
      expect(JSON.parse(confirmations[0].body ?? '{}').token)
        .toBe('abc+def/ghi==');
    });
  });
});
