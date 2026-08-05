import {
  Award,
  CheckCircle2,
  ChevronUp,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  RewardFeedbackContext,
  type RewardFeedbackEvent,
  type RewardPhase,
} from './rewardFeedback.ts';

export default function RewardFeedbackProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<RewardFeedbackEvent[]>([]);
  const [phase, setPhase] = useState<RewardPhase>('flying');
  const seenIds = useRef(new Set<string>());
  const leaveTimer = useRef<number | null>(null);
  const activeReward = queue[0] ?? null;

  const showReward = useCallback((reward: RewardFeedbackEvent) => {
    if (seenIds.current.has(reward.rewardEventId)) return;
    seenIds.current.add(reward.rewardEventId);
    setQueue((current) => [...current, reward]);
  }, []);

  const dismissReward = useCallback(() => {
    if (!activeReward || phase === 'leaving') return;
    setPhase('leaving');
    leaveTimer.current = window.setTimeout(() => {
      setQueue((current) => current.slice(1));
      setPhase('flying');
    }, prefersReducedMotion(activeReward) ? 0 : 160);
  }, [activeReward, phase]);

  useEffect(() => {
    if (!activeReward) return;
    setPhase(prefersReducedMotion(activeReward) ? 'arrived' : 'flying');
    if (prefersReducedMotion(activeReward)) return;
    const arrivalTimer = window.setTimeout(() => setPhase('arrived'), 680);
    return () => window.clearTimeout(arrivalTimer);
  }, [activeReward]);

  useEffect(() => () => {
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
  }, []);

  const value = useMemo(() => ({
    activeReward,
    phase,
    showReward,
    dismissReward,
  }), [activeReward, dismissReward, phase, showReward]);

  return (
    <RewardFeedbackContext.Provider value={value}>
      {children}
      {activeReward && (
        <RewardToastHost
          key={activeReward.rewardEventId}
          onDismiss={dismissReward}
          phase={phase}
          reward={activeReward}
        />
      )}
    </RewardFeedbackContext.Provider>
  );
}

function RewardToastHost({
  onDismiss,
  phase,
  reward,
}: {
  onDismiss: () => void;
  phase: RewardPhase;
  reward: RewardFeedbackEvent;
}) {
  const sourceRef = useRef<HTMLDivElement>(null);
  const timer = usePausableDismiss(onDismiss, 5000);
  const levelUp = reward.level > reward.previousLevel;
  const rankUp = reward.rankTitle !== reward.previousRankTitle;
  const reduced = prefersReducedMotion(reward);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[70] flex justify-end sm:inset-x-auto sm:right-5 sm:w-[24rem]"
      data-reward-host
    >
      <RewardParticles reduced={reduced} sourceRef={sourceRef} />
      <section
        aria-label={reward.preview ? 'Reward preview' : 'Quest completion reward'}
        className={`kiwi-reward-toast pointer-events-auto relative w-full overflow-hidden rounded-3xl border border-primary/30 bg-base-100 shadow-[0_24px_70px_rgba(24,48,38,0.24)] ${
          phase === 'leaving' ? 'kiwi-reward-toast-leave' : 'kiwi-reward-toast-enter'
        }`}
        onBlur={(event) => handleBlur(event, timer.resume)}
        onFocus={timer.pause}
        onMouseEnter={timer.pause}
        onMouseLeave={timer.resume}
      >
        <div className="kiwi-topography absolute inset-0 opacity-70" />
        <div className="relative p-5">
          <button
            aria-label="Close reward notification"
            className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3 min-h-11 min-w-11"
            onClick={onDismiss}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>

          <div aria-atomic="true" aria-live="polite" role="status">
            <div className="flex items-center gap-3 pr-10">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content shadow-sm">
                <CheckCircle2 aria-hidden="true" className="size-6" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="kiwi-stat-label text-primary">Quest verified</p>
                  {reward.preview && (
                    <span className="rounded-full bg-info/10 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-info">
                      Preview
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-xl">
                  {levelUp
                    ? 'Congratulations — Level up!'
                    : 'Congratulations — Quest complete!'}
                </h2>
                <p className="mt-1 truncate text-sm text-muted-content">{reward.questTitle}</p>
              </div>
            </div>

            <div
              className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3"
              data-reward-source
              ref={sourceRef}
            >
              <span>
                <span className="block text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-muted-content">
                  XP earned
                </span>
                <strong className="mt-0.5 inline-flex items-center gap-1.5 text-xl text-base-content">
                  <Zap aria-hidden="true" className="size-5 text-warning" />
                  +{reward.xpAwarded} XP
                </strong>
              </span>
              <span className="text-right text-xs font-bold text-muted-content">
                {reward.totalXp.toLocaleString()} total
              </span>
            </div>

            {(levelUp || rankUp) && (
              <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/8 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-content">
                    <ChevronUp aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="kiwi-stat-label text-primary">
                      {rankUp ? 'Rank up' : 'Level up'}
                    </p>
                    <p className="mt-1 font-extrabold">
                      Level {reward.previousLevel} → Level {reward.level}
                    </p>
                    {rankUp && (
                      <p className="mt-0.5 text-sm text-muted-content">
                        {reward.rankTitle} unlocked
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {reward.unlockedAchievements.length > 0 && (
              <div className="mt-3 rounded-2xl border border-accent/35 bg-accent/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-content">
                    <Award aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="kiwi-stat-label">Achievement unlocked</p>
                    {reward.unlockedAchievements.slice(0, 2).map((achievement) => (
                      <p className="mt-1 font-extrabold" key={achievement.achievementId}>
                        {achievement.name}
                      </p>
                    ))}
                    {reward.unlockedAchievements.length > 2 && (
                      <p className="mt-1 text-xs text-muted-content">
                        +{reward.unlockedAchievements.length - 2} more in your Passport
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-content">
            <Sparkles aria-hidden="true" className="size-3.5 text-warning" />
            Saved to your Impact Passport
          </p>
          <div
            aria-hidden="true"
            className="kiwi-reward-timer absolute bottom-0 left-0 h-0.5 bg-primary"
            style={{ animation: reduced ? 'none' : 'kiwi-reward-timer 5s linear forwards' }}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
}

function RewardParticles({
  reduced,
  sourceRef,
}: {
  reduced: boolean;
  sourceRef: RefObject<HTMLDivElement | null>;
}) {
  const particleRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useLayoutEffect(() => {
    if (reduced || !sourceRef.current) return;
    const target = document.querySelector<HTMLElement>('[data-reward-target="xp"]');
    if (!target) return;

    const sourceRect = sourceRef.current.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const startX = sourceRect.left + Math.min(sourceRect.width * 0.25, 70);
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const arcs = [-72, 54, -34, 78, -58, 30, -88, 46, -20];
    const animations: Animation[] = [];

    particleRefs.current.forEach((particle, index) => {
      if (!particle || typeof particle.animate !== 'function') return;
      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      const arc = arcs[index] ?? 0;
      animations.push(particle.animate([
        { opacity: 0, transform: 'translate3d(0, 0, 0) rotate(0deg) scale(.35)' },
        { opacity: 1, offset: 0.16, transform: `translate3d(${arc * 0.18}px, -10px, 0) rotate(50deg) scale(1)` },
        { opacity: 1, offset: 0.58, transform: `translate3d(${dx * 0.52 + arc}px, ${dy * 0.42 - Math.abs(arc) * 0.25}px, 0) rotate(145deg) scale(.8)` },
        { opacity: 0, transform: `translate3d(${dx}px, ${dy}px, 0) rotate(260deg) scale(.2)` },
      ], {
        delay: 90 + index * 32,
        duration: 500 + (index % 3) * 45,
        easing: 'cubic-bezier(.22,.74,.28,1)',
        fill: 'both',
      }));
    });

    return () => animations.forEach((animation) => animation.cancel());
  }, [reduced, sourceRef]);

  if (reduced) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[71] overflow-hidden"
      data-reward-particles
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span
          className={`fixed block bg-warning shadow-[0_0_10px_color-mix(in_oklab,var(--color-warning)_65%,transparent)] ${
            index % 3 === 0 ? 'size-2 rotate-45 rounded-[2px]' : 'size-1.5 rounded-full'
          }`}
          key={index}
          ref={(element) => { particleRefs.current[index] = element; }}
        />
      ))}
    </div>
  );
}

function usePausableDismiss(onDismiss: () => void, duration: number) {
  const onDismissRef = useRef(onDismiss);
  const timeout = useRef<number | null>(null);
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  const pause = useCallback(() => {
    if (timeout.current === null) return;
    window.clearTimeout(timeout.current);
    timeout.current = null;
    remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
  }, []);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const resume = useCallback(() => {
    if (timeout.current !== null || remaining.current <= 0) return;
    startedAt.current = performance.now();
    timeout.current = window.setTimeout(
      () => onDismissRef.current(),
      remaining.current,
    );
  }, []);

  useEffect(() => {
    remaining.current = duration;
    resume();
    const onVisibilityChange = () => {
      if (document.hidden) pause();
      else resume();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timeout.current !== null) {
        window.clearTimeout(timeout.current);
        timeout.current = null;
      }
    };
  }, [duration, pause, resume]);

  return { pause, resume };
}

function handleBlur(event: FocusEvent<HTMLElement>, resume: () => void) {
  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) resume();
}

function prefersReducedMotion(reward: RewardFeedbackEvent): boolean {
  if (reward.motionPreference === 'reduced') return true;
  if (reward.motionPreference === 'full') return false;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
