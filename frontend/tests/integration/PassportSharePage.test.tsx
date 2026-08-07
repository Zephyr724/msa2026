import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authQueryKey } from '../../src/hooks/useAuth.ts';
import PassportSharePage from '../../src/pages/PassportSharePage.tsx';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils.tsx';

vi.mock('../../src/lib/svgImageLoader.ts', () => ({
  loadSvgImage: vi.fn(() => Promise.resolve({} as HTMLImageElement)),
}));

function installCanvasMock() {
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({
    createLinearGradient: vi.fn(() => gradient),
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
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(new Blob(['passport'], { type: 'image/png' }));
  });
}

function renderPage(achievementsPending = false) {
  installCanvasMock();
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/users/me/progression')) {
      return Promise.resolve(jsonResponse({ totalXp: 200, level: 4, rankTitle: 'Novice' }));
    }
    if (url.endsWith('/v1/users/me/passport')) {
      return Promise.resolve(jsonResponse({
        displayName: 'Test Member 1', totalXp: 200, level: 4, rankTitle: 'Novice',
        homeCommunity: { id: '11111111-1111-4111-8111-111111111111', name: 'Auckland Central', type: 'LocalArea', parentRegionId: null },
        verifiedCompletionCount: 3, selfReportedCompletionCount: 0, pendingCompletionCount: 0,
        categoryImpact: [{ category: 'RestoreNature', verifiedCompletionCount: 3, verifiedXp: 200 }],
      }));
    }
    if (url.endsWith('/v1/users/me/achievement-profile')) {
      return Promise.resolve(jsonResponse({
        earnedDistinctCount: 2, activeAchievementCount: 45,
        trophy: { tier: 'Locked', requiredCount: 0, nextTier: 'Bronze', nextRequiredCount: 5, nationwideEarnedCount: 0, nationwideMemberCount: 9, earnedPercentage: 0, rarity: 'Unawarded', calculatedAtUtc: '2026-08-07T00:00:00Z' },
        cosmetics: { passportBorderStyle: null, avatarFrameStyle: 'sprout', badgeStampStyles: [] },
      }));
    }
    if (url.endsWith('/v1/users/me/achievements')) {
      if (achievementsPending) return new Promise<Response>(() => {});
      return Promise.resolve(jsonResponse([
        { achievementId: '22222222-2222-4222-8222-222222222222', code: 'verified-completions-1', name: 'First Steps', description: 'First', iconUrl: null, category: 'Milestone', awardedAt: '2026-08-01T00:00:00Z' },
        { achievementId: '33333333-3333-4333-8333-333333333333', code: 'verified-completions-3', name: 'Building Momentum', description: 'Third', iconUrl: null, category: 'Milestone', awardedAt: '2026-08-07T00:00:00Z' },
      ]));
    }
    if (url.endsWith('/v1/achievement-stats')) {
      return Promise.resolve(jsonResponse([
        { achievementId: '22222222-2222-4222-8222-222222222222', nationwideEarnedCount: 5, nationwideMemberCount: 10, earnedPercentage: 50, rarity: 'Common', calculatedAtUtc: '2026-08-07T00:00:00Z' },
        { achievementId: '33333333-3333-4333-8333-333333333333', nationwideEarnedCount: 1, nationwideMemberCount: 10, earnedPercentage: 10, rarity: 'Rare', calculatedAtUtc: '2026-08-07T00:00:00Z' },
      ]));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request' }, 500));
  }));
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authQueryKey, { userId: 'u1', displayName: 'Test Member 1', email: 'member1@kiwimpact.test', roles: ['Member'] });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><PassportSharePage /></MemoryRouter></QueryClientProvider>);
}

describe('PassportSharePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shares the whole Passport with trophy and every earned achievement', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Share your Passport' })).toBeInTheDocument();
    expect(await screen.findByText('First trophy awaits')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'First Steps badge, earned' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Building Momentum badge, earned' })).toBeInTheDocument();
    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.getByText('Rare')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Passport share preview for Test Member 1' })).toHaveAttribute('width', '1080');
    expect(screen.getByRole('button', { name: 'Download Passport PNG' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Share Passport PNG' })).toBeEnabled();
    expect(screen.getByRole('link', { name: /one Quest instead/ })).toHaveAttribute('href', '/passport/share/completion');
    expect(screen.getByText(/Home Community, precise location, email/)).toBeInTheDocument();
  });

  it('blocks export while achievement artwork is unresolved', async () => {
    renderPage(true);
    expect(await screen.findByRole('heading', { name: 'Share your Passport' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download Passport PNG' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Share Passport PNG' })).toBeDisabled();
    expect(screen.getByText('Preparing trophy and all achievement artwork…')).toBeInTheDocument();
  });

  it('shares the generated Passport PNG without an authenticated page URL', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', Object.assign(Object.create(window.navigator), { canShare, share }));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Share Passport PNG' }));

    await waitFor(() => expect(share).toHaveBeenCalledWith({
      files: [expect.any(File)],
      text: 'My Kiwimpact Personal Impact Passport.',
      title: 'My Kiwimpact Passport',
    }));
    expect(share.mock.calls[0]?.[0]).not.toHaveProperty('url');
    expect(canShare).toHaveBeenCalledWith({ files: [expect.any(File)] });
  });
});
