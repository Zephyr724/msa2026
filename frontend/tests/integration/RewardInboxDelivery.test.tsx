import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RewardInboxDelivery from '../../src/components/reward/RewardInboxDelivery.tsx';

const mocks = vi.hoisted(() => ({
  acknowledge: vi.fn(),
  showReward: vi.fn(),
  syncMemberRewardSurfaces: vi.fn(),
  useRewardInbox: vi.fn(),
}));

vi.mock('../../src/hooks/useAuth.ts', () => ({
  useAuthQuery: () => ({ data: { userId: 'member-1' } }),
}));

const reward = {
  rewardEventId: '8f43bb27-89c7-4b12-8234-12c70f5d6395',
  questCompletionId: '936b96fb-f895-42fa-8c53-008e37fc38f7',
  questId: '9ed6a4a5-631d-4b55-8203-72b760039c47',
  questTitle: 'Waitākere Stream Care',
  celebrationTitle: 'Well Done!',
  celebrationMessage: 'Your verified action is now part of the community impact story.',
  verificationMethod: 'EvidenceClaim' as const,
  xpAwarded: 50,
  previousTotalXp: 170,
  totalXp: 220,
  previousLevel: 4,
  level: 4,
  previousRankTitle: 'Novice',
  rankTitle: 'Novice',
  streak: {
    previousWeeks: 2,
    previousHasVerifiedImpactThisWeek: false,
    weeks: 3,
    hasVerifiedImpactThisWeek: true,
  },
  communityChallenge: null,
  unlockedAchievements: [],
  createdAtUtc: '2026-08-07T08:00:00.0000000Z',
  seenAtUtc: null,
};

vi.mock('../../src/hooks/useCompletion.ts', () => ({
  useRewardInbox: mocks.useRewardInbox,
  useAcknowledgeRewardEvent: () => mocks.acknowledge,
  rewardEventKeys: {
    quest: (questId: string) => ['reward-events', 'quest', questId] as const,
  },
  syncMemberRewardSurfaces: mocks.syncMemberRewardSurfaces,
}));

vi.mock('../../src/components/reward/rewardFeedback.ts', () => ({
  useRewardFeedback: () => ({ showReward: mocks.showReward }),
}));

describe('durable asynchronous reward delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acknowledge.mockResolvedValue(reward);
    mocks.syncMemberRewardSurfaces.mockResolvedValue(undefined);
    mocks.useRewardInbox.mockReturnValue({ data: { items: [reward] } });
  });

  it('shows the reward, refreshes member progress, and acknowledges delivery', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    render(
      <QueryClientProvider client={queryClient}>
        <RewardInboxDelivery />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.showReward).toHaveBeenCalledWith(reward));
    expect(mocks.syncMemberRewardSurfaces)
      .toHaveBeenCalledWith(queryClient, reward.questId);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['reward-events', 'quest', reward.questId],
      exact: true,
    });
    expect(mocks.acknowledge).toHaveBeenCalledWith(reward.rewardEventId);
  });
});
