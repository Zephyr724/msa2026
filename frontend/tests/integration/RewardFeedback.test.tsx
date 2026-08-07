import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RewardFeedbackProvider from '../../src/components/reward/RewardFeedbackProvider.tsx';
import { useRewardFeedback } from '../../src/components/reward/rewardFeedback.ts';
import type { RewardFeedbackEvent } from '../../src/components/reward/rewardFeedback.ts';

const standardReward: RewardFeedbackEvent = {
  rewardEventId: '8f43bb27-89c7-4b12-8234-12c70f5d6395',
  questCompletionId: '936b96fb-f895-42fa-8c53-008e37fc38f7',
  questId: '9ed6a4a5-631d-4b55-8203-72b760039c47',
  questTitle: 'Waitākere Stream Care',
  celebrationTitle: 'Well Done!',
  celebrationMessage: 'Your verified action is now part of the community impact story.',
  verificationMethod: 'CompletionCode',
  xpAwarded: 50,
  previousTotalXp: 170,
  totalXp: 220,
  previousLevel: 4,
  level: 4,
  previousRankTitle: 'Novice',
  rankTitle: 'Novice',
  streak: {
    previousWeeks: 2,
    previousHasVerifiedImpactThisWeek: true,
    weeks: 2,
    hasVerifiedImpactThisWeek: true,
  },
  communityChallenge: null,
  unlockedAchievements: [],
  createdAtUtc: '2026-08-06T12:00:00.0000000Z',
  seenAtUtc: null,
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
    <MemoryRouter>
      <RewardFeedbackProvider>
        <Harness reward={reward} />
      </RewardFeedbackProvider>
    </MemoryRouter>,
  );
}

describe('Reward feedback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('configures a CSS particle trajectory without requiring Web Animations API', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getRewardRect() {
        if (this.hasAttribute('data-reward-source')) {
          return {
            bottom: 170,
            height: 50,
            left: 600,
            right: 800,
            top: 120,
            width: 200,
            x: 600,
            y: 120,
            toJSON: () => ({}),
          };
        }
        if (this.hasAttribute('data-reward-target')) {
          return {
            bottom: 50,
            height: 30,
            left: 900,
            right: 1000,
            top: 20,
            width: 100,
            x: 900,
            y: 20,
            toJSON: () => ({}),
          };
        }
        return {
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      });

    renderReward();
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));

    const particles = document.querySelectorAll<SVGSVGElement>('[data-reward-particle]');
    expect(particles).toHaveLength(7);
    expect([...particles].every((particle) => (
      particle.classList.contains('kiwi-reward-flight-sparkle')
      && particle.dataset.particleShape === 'single-four-point-outline'
      && particle.querySelectorAll('path').length === 1
      && particle.querySelector('path')?.getAttribute('fill') === 'none'
      && particle.querySelector('path')?.getAttribute('stroke') === 'currentColor'
      && particle.querySelector('path')?.getAttribute('stroke-width') === '3.168'
    )))
      .toBe(true);
    expect(particles[0]).toHaveAttribute('data-ready', 'true');
    expect(particles[0]?.style.left).toBe('636.5px');
    expect(particles[0]?.style.top).toBe('131.5px');
    expect(particles[0]?.style.getPropertyValue('--kiwi-particle-end-x')).toBe('300px');
    expect(particles[0]?.style.getPropertyValue('--kiwi-particle-end-y')).toBe('-110px');
    expect(particles[0]?.style.getPropertyValue('--kiwi-particle-duration')).toBe('1300ms');
    expect(particles[1]?.style.getPropertyValue('--kiwi-particle-duration')).toBe('1200ms');
    expect(particles[6]?.style.getPropertyValue('--kiwi-particle-duration')).toBe('700ms');
    expect(particles[0]?.style.getPropertyValue('--kiwi-particle-delay')).toBe('480ms');
    expect(particles[1]?.style.getPropertyValue('--kiwi-particle-delay')).toBe('610ms');
    expect(particles[6]?.style.getPropertyValue('--kiwi-particle-delay')).toBe('1260ms');
    expect(1260 + 700).toBeLessThanOrEqual(2000);
    expect(particles[0]?.style.getPropertyValue('--kiwi-particle-p50-x'))
      .toBe(particles[1]?.style.getPropertyValue('--kiwi-particle-p50-x'));
    expect(particles[0]?.style.getPropertyValue('--kiwi-particle-p50-y'))
      .toBe(particles[1]?.style.getPropertyValue('--kiwi-particle-p50-y'));
  });

  it('shows a non-modal completion toast and can be dismissed explicitly', () => {
    renderReward();
    const trigger = screen.getByRole('button', { name: 'Show reward' });
    fireEvent.click(trigger);

    expect(screen.getByRole('region', { name: 'Quest completion reward' }))
      .toBeInTheDocument();
    const title = screen.getByRole('heading', { name: 'MISSION COMPLETE' });
    const stateHeading = screen.getByRole('heading', { name: 'Quest complete!' });
    expect(title).toHaveAttribute('data-reward-congratulation');
    expect(title.querySelector('svg')).toHaveClass('w-[86%]');
    expect(title.querySelector('text')).toHaveAttribute('textLength', '310');
    expect(title.querySelector('textPath')).toHaveTextContent('Mission Complete');
    expect(title.compareDocumentPosition(stateHeading) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    const encouragement = document.querySelector('[data-reward-encouragement]');
    expect(encouragement).toHaveTextContent(standardReward.celebrationTitle);
    expect(encouragement).toHaveTextContent(standardReward.celebrationMessage);
    const xpValue = screen.getByText('+50 XP');
    expect(xpValue).toHaveClass('kiwi-reward-xp-value');
    expect(xpValue).toHaveClass('kiwi-reward-gold-text');
    const xpIcon = document.querySelector('[data-reward-xp-icon]');
    expect(xpIcon).toHaveClass('lucide-sparkles', 'kiwi-reward-gold-text');
    expect(xpIcon).not.toHaveClass('kiwi-reward-xp-value');
    expect(document.activeElement).not.toBe(
      screen.getByRole('button', { name: 'Close reward notification' }),
    );
    expect(screen.getByRole('link', {
      name: 'Passport saved. View your Impact Passport',
    })).toHaveAttribute('href', '/passport');
    expect(screen.getByText('Your record is updated')).toHaveClass('sm:whitespace-nowrap');
    expect(document.querySelector('[data-reward-host]')).toHaveClass('sm:w-[27rem]');
    expect(screen.getByRole('link', { name: 'Review Quest' }))
      .toHaveClass('btn-primary');
    expect(screen.getByRole('link', { name: 'Review Quest' }))
      .toHaveAttribute('href', `/quests/${standardReward.questId}`);

    fireEvent.click(screen.getByRole('button', { name: 'Close reward notification' }));
    expect(screen.getByRole('region', { name: 'Quest completion reward' }))
      .toHaveClass('kiwi-reward-toast-leave');
  });

  it('auto-dismisses after twenty active seconds and pauses while hovered', () => {
    vi.useFakeTimers();
    renderReward();
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));
    const toast = screen.getByRole('region', { name: 'Quest completion reward' });

    act(() => vi.advanceTimersByTime(3000));
    fireEvent.mouseEnter(toast);
    expect(document.querySelector<HTMLElement>('[data-reward-timer]')?.style.animationPlayState)
      .toBe('paused');
    act(() => vi.advanceTimersByTime(5000));
    expect(toast).toBeInTheDocument();

    fireEvent.mouseLeave(toast);
    expect(document.querySelector<HTMLElement>('[data-reward-timer]')?.style.animationPlayState)
      .toBe('running');
    act(() => vi.advanceTimersByTime(17200));
    expect(screen.queryByRole('region', { name: 'Quest completion reward' }))
      .not.toBeInTheDocument();
  });

  it('waits for visibility before timing a reward delivered into a hidden tab', () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    renderReward();
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));

    act(() => vi.advanceTimersByTime(25_000));
    expect(screen.getByRole('region', { name: 'Quest completion reward' }))
      .toBeInTheDocument();

    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(20_300));
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

    const title = screen.getByRole('heading', { name: 'CONGRATULATIONS!' });
    expect(title.querySelector('textPath')).toHaveTextContent('Congratulations!');
    expect(screen.getByText('Level up!')).toBeInTheDocument();
    expect(screen.getByText('Rank up')).toBeInTheDocument();
    expect(screen.getByLabelText('Level 9 to Level 10')).toBeInTheDocument();
    expect(screen.getByText('→')).toHaveClass('kiwi-reward-level-arrow');
    expect(screen.getByText('Level 10')).toHaveClass('kiwi-reward-level-target');
    expect(screen.getByText('Scout unlocked')).toBeInTheDocument();
    expect(screen.getByText('Building Momentum'))
      .toHaveClass('kiwi-reward-gold-text', 'kiwi-reward-achievement-stamp');
    expect(document.querySelector('[data-reward-achievement-title]'))
      .toHaveClass('kiwi-reward-achievement-stamp');
    expect(document.querySelector('[data-reward-achievement]'))
      .not.toHaveClass('kiwi-reward-achievement-stamp');
    const host = document.querySelector<HTMLElement>('[data-reward-host]');
    expect(host?.style.getPropertyValue('--kiwi-reward-xp-delay')).toBe('180ms');
    expect(host?.style.getPropertyValue('--kiwi-reward-level-arrow-delay')).toBe('2960ms');
    expect(host?.style.getPropertyValue('--kiwi-reward-level-target-delay')).toBe('3184ms');
    expect(host?.style.getPropertyValue('--kiwi-reward-achievement-delay')).toBe('4280ms');
    expect(document.querySelector<HTMLElement>('[data-reward-timer]')?.style.animation)
      .toContain('20000ms');
  });

  it('keeps a combined reward visible for twenty seconds', () => {
    vi.useFakeTimers();
    renderReward({
      ...standardReward,
      previousLevel: 9,
      level: 10,
      unlockedAchievements: [{
        achievementId: 'ed2faa73-1947-4b4b-826a-af7384d4ed10',
        code: 'verified-completions-3',
        name: 'Building Momentum',
      }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));

    act(() => vi.advanceTimersByTime(10200));
    expect(screen.getByRole('region', { name: 'Quest completion reward' }))
      .toBeInTheDocument();

    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByRole('region', { name: 'Quest completion reward' }))
      .not.toBeInTheDocument();
  });

  it('renders the Evidence Approval title in readable Title Case', () => {
    renderReward({
      ...standardReward,
      verificationMethod: 'EvidenceClaim',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show reward' }));

    const title = screen.getByRole('heading', { name: 'MISSION VERIFIED' });
    expect(title.querySelector('textPath')).toHaveTextContent('Mission Verified');
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
    expect(screen.getAllByRole('heading', { name: 'MISSION COMPLETE' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close reward notification' }));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole('heading', { name: 'MISSION COMPLETE' }))
      .not.toBeInTheDocument();
  });
});
