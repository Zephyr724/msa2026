import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgression } from '../hooks/useProgression.ts';
import { RankCrest } from './game/GameArtwork.tsx';
import {
  useRewardFeedback,
  type RewardMotionPreference,
} from './reward/rewardFeedback.ts';

export default function PlayerStatusCapsule() {
  const progression = useProgression();
  const { activeReward, phase } = useRewardFeedback();
  const arrived = phase !== 'flying';
  const displayTotalXp = activeReward
    ? arrived ? activeReward.totalXp : activeReward.previousTotalXp
    : progression.data?.totalXp ?? 0;
  const displayLevel = activeReward
    ? arrived ? activeReward.level : activeReward.previousLevel
    : progression.data?.level ?? 1;
  const displayRankTitle = activeReward
    ? arrived ? activeReward.rankTitle : activeReward.previousRankTitle
    : progression.data?.rankTitle ?? 'Novice';
  const animatedXp = useAnimatedXp(
    displayTotalXp,
    Boolean(activeReward && arrived && !prefersReducedMotion(activeReward.motionPreference)),
  );

  if (progression.isPending) {
    return (
      <span
        aria-live="polite"
        className="skeleton h-9 w-9 rounded-full lg:w-32"
        data-reward-target="xp"
      />
    );
  }

  if (!progression.data) return null;

  return (
    <Link
      aria-label={`${animatedXp} XP, level ${displayLevel}, ${displayRankTitle}`}
      className={`flex size-9 shrink-0 items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 transition-[opacity,box-shadow,transform] hover:opacity-80 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 lg:h-auto lg:w-auto lg:justify-start lg:px-3 lg:py-1.5 ${
        activeReward && arrived ? 'kiwi-xp-receive' : ''
      }`}
      data-reward-target="xp"
      to="/passport"
    >
      <span className="hidden lg:block">
        <RankCrest rankTitle={displayRankTitle} size={24} />
      </span>
      <Sparkles aria-hidden="true" className="size-3.5 text-amber-600 dark:text-amber-400" />
      <span className="hidden whitespace-nowrap lg:inline">
        {animatedXp} XP · Lv {displayLevel}
      </span>
    </Link>
  );
}

export function RewardPreviewStatusCapsule() {
  const { activeReward, phase } = useRewardFeedback();
  const preview = activeReward?.preview ? activeReward : null;
  const arrived = phase !== 'flying';
  const totalXp = preview
    ? arrived ? preview.totalXp : preview.previousTotalXp
    : 170;
  const level = preview
    ? arrived ? preview.level : preview.previousLevel
    : 3;
  const animatedXp = useAnimatedXp(
    totalXp,
    Boolean(preview && arrived && !prefersReducedMotion(preview.motionPreference)),
  );

  return (
    <span
      aria-label={`Reward preview: ${animatedXp} XP, level ${level}`}
      className={`flex size-9 shrink-0 items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 transition-[box-shadow,transform] dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 lg:h-auto lg:w-auto lg:px-3 lg:py-1.5 ${
        preview && arrived ? 'kiwi-xp-receive' : ''
      }`}
      data-reward-target="xp"
      title="Reward Lab preview XP"
    >
      <Sparkles aria-hidden="true" className="size-3.5 text-amber-600 dark:text-amber-400" />
      <span className="hidden whitespace-nowrap lg:inline">
        {animatedXp} XP · Lv {level}
      </span>
    </span>
  );
}

function useAnimatedXp(target: number, animate: boolean): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    if (!animate || typeof window.requestAnimationFrame !== 'function') {
      valueRef.current = target;
      setValue(target);
      return;
    }

    const startValue = valueRef.current;
    const delta = target - startValue;
    if (delta === 0) return;
    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 320);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startValue + delta * eased);
      valueRef.current = next;
      setValue(next);
      if (progress < 1) frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [animate, target]);

  return value;
}

function prefersReducedMotion(preference: RewardMotionPreference | undefined): boolean {
  if (preference === 'reduced') return true;
  if (preference === 'full') return false;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
