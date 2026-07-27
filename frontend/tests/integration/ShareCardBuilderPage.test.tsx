import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import ShareCardBuilderPage from '../../src/pages/ShareCardBuilderPage.tsx';
import {
  createTestQueryClient,
  jsonResponse,
} from '../organizerTestUtils.tsx';

const verified = {
  completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  questId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  questTitle: 'Harbour restoration day',
  questCategory: 'RestoreNature',
  questStatus: 'Published',
  status: 'Verified',
  method: 'CompletionCode',
  completedAtUtc: '2026-07-20T09:00:00.0000000Z',
  verifiedAtUtc: '2026-07-21T09:00:00.0000000Z',
  xpAmount: 50,
};

const selfReported = {
  ...verified,
  completionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  questId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  questTitle: 'Private garden reflection',
  status: 'SelfReported',
  method: 'SelfReported',
  verifiedAtUtc: null,
  xpAmount: null,
};

function installCanvasMock() {
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({
    createLinearGradient: vi.fn(() => gradient),
    measureText: vi.fn((value: string) => ({ width: value.length * 20 })),
  } as unknown as CanvasRenderingContext2D, {
    get(target, property) {
      if (property in target) return target[property as keyof typeof target];
      return vi.fn();
    },
    set(target, property, value) {
      Reflect.set(target, property, value);
      return true;
    },
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => context);
}

function renderPage(items: unknown[]) {
  installCanvasMock();
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/users/me/progression')) {
      return Promise.resolve(jsonResponse({
        totalXp: 120,
        level: 3,
        rankTitle: 'Novice',
      }));
    }
    if (url.includes('/v1/users/me/passport/completions')) {
      return Promise.resolve(jsonResponse({
        items,
        page: 1,
        pageSize: 50,
        totalCount: items.length,
        totalPages: items.length === 0 ? 0 : 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  }));
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authQueryKey, {
    userId: 'user-1',
    displayName: 'Aroha',
    email: 'member@example.test',
    roles: ['Member'],
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ShareCardBuilderPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShareCardBuilderPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('offers only verified records and updates accessible visual controls', async () => {
    const user = userEvent.setup();
    renderPage([verified, selfReported]);

    expect(await screen.findByRole('heading', { name: 'Share Card Builder' }))
      .toBeInTheDocument();
    expect(await screen.findByText('Harbour restoration day')).toBeInTheDocument();
    expect(screen.queryByText('Private garden reflection')).not.toBeInTheDocument();
    expect(screen.getByRole('img', {
      name: 'Share Card preview for Harbour restoration day',
    })).toHaveAttribute('width', '1080');
    expect(screen.getByText(/Home Community or precise location/))
      .toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ocean' }));
    expect(screen.getByRole('button', { name: 'Ocean' }))
      .toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(screen.getByRole('button', { name: 'Light' }))
      .toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('checkbox', { name: /Show display name/ }));
    expect(screen.getByRole('checkbox', { name: /Show display name/ })).toBeChecked();
  });

  it('shows an honest empty state when no verified record exists', async () => {
    renderPage([selfReported]);

    expect(await screen.findByText('Complete a verified Quest first'))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open My Quests/ }))
      .toHaveAttribute('href', '/my-quests');
    expect(screen.queryByRole('button', { name: 'Download PNG' }))
      .not.toBeInTheDocument();
  });
});
