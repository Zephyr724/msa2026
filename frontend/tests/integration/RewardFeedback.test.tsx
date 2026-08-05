import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RewardFeedbackProvider from '../../src/components/reward/RewardFeedbackProvider.tsx';
import { useRewardFeedback } from '../../src/components/reward/rewardFeedback.ts';
import type { RewardFeedbackEvent } from '../../src/components/reward/rewardFeedback.ts';

const standardReward: RewardFeedbackEvent = {
  rewardEventId: '8f43bb27-89c7-4b12-8234-12c70f5d6395',
  questTitle: 'Waitākere Stream Care',
  xpAwarded: 50,
  previousTotalXp: 170,
  totalXp: 220,
  previousLevel: 4,
  level: 4,
  previousRankTitle: 'Novice',
  rankTitle: 'Novice',
  unlockedAchievements: [],
  motionPreference: 'full',
};

function Harness({ reward = standardReward }: { reward?: RewardFeedbackEvent }) {
  const { showReward } = useRewardFeedback();
  return (
    <>
      <button onClick={() => showReward(reward)} type="button">Show reward</button>
      <span data-reward-target="xp">XP target</span>
    </>
  );
}

function renderReward(reward = standardReward) {
  return render(
    <RewardFeedbackProvider>
      <Harness reward={reward} />
    </RewardFeedbackProvider>,
  );
}

describe('Reward feedback', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a non-modal completion toast and can be dismissed explicitly', () => {
    renderReward();
    const trigger = screen.getByRole('button', { name: 'Show reward' });
    fireEvent.click(trigger);

    expect(screen.getByRole('region', { name: 'Quest completion reward' }))
      .toBeInTheDocument();
    expect(screen.getByText('Congratulations — Quest complete!')).toBeInTheDocument();
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
    expect(document.activeElement).not.toBe(
      screen.getByRole('button', { name: 'Close reward notification' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close reward notification' }));
    expect(screen.getByRole('region', { name: 'Quest completion reward' }))
      .toHaveClass('kiwi-reward-toast-leave');
  });

  it('auto-dismisses after five active seconds and pauses while hovered', () => {
    vi.useFakeTimers();
    renderReward();
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));
    const toast = screen.getByRole('region', { name: 'Quest completion reward' });

    act(() => vi.advanceTimersByTime(3000));
    fireEvent.mouseEnter(toast);
    act(() => vi.advanceTimersByTime(5000));
    expect(toast).toBeInTheDocument();

    fireEvent.mouseLeave(toast);
    act(() => vi.advanceTimersByTime(2200));
    expect(screen.queryByRole('region', { name: 'Quest completion reward' }))
      .not.toBeInTheDocument();
  });

  it('reveals authoritative level, rank and achievement changes', () => {
    renderReward({
      ...standardReward,
      previousTotalXp: 740,
      totalXp: 790,
      previousLevel: 9,
      level: 10,
      previousRankTitle: 'Novice',
      rankTitle: 'Scout',
      unlockedAchievements: [{
        achievementId: 'ed2faa73-1947-4b4b-826a-af7384d4ed10',
        code: 'verified-completions-3',
        name: 'Building Momentum',
      }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));

    expect(screen.getByText('Congratulations — Level up!')).toBeInTheDocument();
    expect(screen.getByText('Rank up')).toBeInTheDocument();
    expect(screen.getByText('Level 9 → Level 10')).toBeInTheDocument();
    expect(screen.getByText('Scout unlocked')).toBeInTheDocument();
    expect(screen.getByText('Building Momentum')).toBeInTheDocument();
  });

  it('provides a particle-free reduced-motion variant', () => {
    renderReward({
      ...standardReward,
      motionPreference: 'reduced',
      preview: true,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));

    expect(screen.getByRole('region', { name: 'Reward preview' })).toBeInTheDocument();
    expect(document.querySelector('[data-reward-particles]')).not.toBeInTheDocument();
  });

  it('deduplicates the same reward event id', () => {
    vi.useFakeTimers();
    renderReward();
    const trigger = screen.getByRole('button', { name: 'Show reward' });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.getAllByText('Congratulations — Quest complete!')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close reward notification' }));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText('Congratulations — Quest complete!'))
      .not.toBeInTheDocument();
  });
});
