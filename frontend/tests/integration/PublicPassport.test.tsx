import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PublicPassportSettingsCard from '../../src/components/passport/PublicPassportSettingsCard.tsx';
import { achievementKeys } from '../../src/hooks/useAchievements.ts';
import { publicPassportKeys } from '../../src/hooks/usePublicPassport.ts';
import { resetCsrfToken } from '../../src/lib/api/apiFetch.ts';
import PublicPassportPage from '../../src/pages/PublicPassportPage.tsx';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils.tsx';

const shareId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function earnedAchievement(index: number) {
  return {
    achievementId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    code: `achievement-${index}`,
    name: `Achievement ${index}`,
    description: `Earned achievement ${index}.`,
    iconUrl: null,
    category: 'Milestone',
    awardedAt: '2026-08-01T00:00:00.000Z',
  };
}

function publicPassportPayload() {
  return {
    displayName: 'Aroha',
    verifiedXp: 320,
    verifiedQuestCount: 4,
    level: 5,
    rankTitle: 'Scout',
    trophy: {
      tier: 'Bronze',
      nationwideEarnedCount: 20,
      nationwideMemberCount: 100,
      earnedPercentage: 20,
      rarity: 'Uncommon',
    },
    featuredAchievements: [{
      achievementId: earnedAchievement(1).achievementId,
      name: 'First Steps',
      description: 'Complete a verified Quest.',
      iconUrl: null,
      category: 'Milestone',
      nationwideEarnedCount: 40,
      nationwideMemberCount: 100,
      earnedPercentage: 40,
      rarity: 'Common',
    }],
    verifiedStories: [{
      postId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      title: 'A verified stream restoration',
      content: 'The restoration was completed and verified.',
      images: [{
        imageUrl: 'https://images.example.test/story.jpg',
        imageAltText: 'Volunteers restoring a stream',
        sortOrder: 0,
      }],
      tags: ['restoration'],
      questTitle: 'Stream restoration',
      questCoverImageUrl: null,
      createdAtUtc: '2026-08-01T00:00:00.000Z',
    }],
  };
}

function renderSettings() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(publicPassportKeys.settings, {
    isEnabled: false,
    shareId: null,
    featuredAchievementIds: [],
  });
  queryClient.setQueryData(
    achievementKeys.mine,
    Array.from({ length: 6 }, (_, index) => earnedAchievement(index + 1)),
  );
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicPassportSettingsCard />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

function renderPublicRoute(queryClient = createTestQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/p/${shareId}`]}>
        <Routes>
          <Route path="/p/:shareId" element={<PublicPassportPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Public Passport', () => {
  beforeEach(() => {
    resetCsrfToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('enforces the five-item selection limit, preserves reorder, saves opt-in, and copies the stable link', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    var observedBody: unknown = null;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/auth/csrf-token'))
        return Promise.resolve(jsonResponse({ token: 'csrf-token' }));
      if (url.endsWith('/v1/users/me/public-passport') && init?.method === 'PUT') {
        observedBody = JSON.parse(String(init.body));
        return Promise.resolve(jsonResponse({
          isEnabled: true,
          shareId,
          featuredAchievementIds: (observedBody as { featuredAchievementIds: string[] })
            .featuredAchievementIds,
        }));
      }
      return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
    }));
    renderSettings();

    await user.click(screen.getByRole('checkbox'));
    for (let index = 1; index <= 5; index++)
      await user.click(screen.getByRole('button', { name: `Feature Achievement ${index}` }));
    await user.click(screen.getByRole('button', { name: 'Feature Achievement 6' }));

    expect(screen.getByText('Five selected. Remove one before choosing another.'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Feature Achievement 6' }))
      .toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Move Achievement 2 up' }));
    await user.click(screen.getByRole('button', { name: 'Save public Passport' }));

    await waitFor(() => expect(observedBody).toEqual({
      isEnabled: true,
      featuredAchievementIds: [
        earnedAchievement(2).achievementId,
        earnedAchievement(1).achievementId,
        earnedAchievement(3).achievementId,
        earnedAchievement(4).achievementId,
        earnedAchievement(5).achievementId,
      ],
    }));
    expect(await screen.findByRole('link', { name: /Preview/i }))
      .toHaveAttribute('href', `${window.location.origin}/p/${shareId}`);
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(writeText)
      .toHaveBeenCalledWith(`${window.location.origin}/p/${shareId}`));
  });

  it('renders the public allow-list and responsive compositions and shares via clipboard fallback', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(publicPassportKeys.public(shareId), publicPassportPayload());
    const { container } = renderPublicRoute(queryClient);

    expect(screen.getByRole('heading', { name: 'Aroha' })).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Verified Quest Story')).toBeInTheDocument();
    expect(screen.queryByText(/Home Community|Albert-Eden/i)).not.toBeInTheDocument();
    expect(container.querySelector('.grid.grid-cols-2'))
      .toHaveClass('sm:grid-cols-3');
    expect(screen.getByRole('list')).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3');

    await user.click(screen.getByRole('button', { name: 'Share Passport' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(window.location.href));
  });

  it('uses the same restrained not-found surface for an unavailable public link', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({
      type: 'https://kiwimpact.app/problems/public-passport-not-found',
      title: 'Public Passport not found.',
      status: 404,
    }, 404))));
    renderPublicRoute();

    expect(await screen.findByRole('heading', { name: 'Public Passport not found' }))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore Kiwimpact' }))
      .toHaveAttribute('href', '/');
  });
});
