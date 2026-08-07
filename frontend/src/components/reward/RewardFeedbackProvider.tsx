import {
  Award,
  ArrowRight,
  CheckCircle2,
  ChevronUp,
  Flame,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  RewardFeedbackContext,
  type RewardFeedbackEvent,
  type RewardPhase,
} from './rewardFeedback.ts';

const REWARD_PARTICLE_COUNT = 7;
const REWARD_PARTICLE_SIZE_PX = 27;
const REWARD_PARTICLE_INITIAL_DELAY_MS = 480;
const REWARD_PARTICLE_STAGGER_MS = 130;
const REWARD_PARTICLE_FIRST_DURATION_MS = 1300;
const REWARD_PARTICLE_DURATION_STEP_MS = 100;
const REWARD_PARTICLE_LAST_DURATION_MS = REWARD_PARTICLE_FIRST_DURATION_MS
  - (REWARD_PARTICLE_COUNT - 1) * REWARD_PARTICLE_DURATION_STEP_MS;
const REWARD_PARTICLE_END_MS = REWARD_PARTICLE_INITIAL_DELAY_MS
  + (REWARD_PARTICLE_COUNT - 1) * REWARD_PARTICLE_STAGGER_MS
  + REWARD_PARTICLE_LAST_DURATION_MS;
const REWARD_ARRIVAL_MS = REWARD_PARTICLE_END_MS + 40;
const REWARD_XP_DELAY_MS = 180;
const REWARD_LEVEL_ARROW_DELAY_MS = REWARD_PARTICLE_END_MS + 1000;
const REWARD_LEVEL_ARROW_DURATION_MS = 320;
const REWARD_LEVEL_TARGET_DELAY_MS = REWARD_LEVEL_ARROW_DELAY_MS + 224;
const REWARD_ACHIEVEMENT_WITH_LEVEL_DELAY_MS = REWARD_LEVEL_ARROW_DELAY_MS
  + REWARD_LEVEL_ARROW_DURATION_MS
  + 1000;
const REWARD_ACHIEVEMENT_NO_LEVEL_DELAY_MS = REWARD_PARTICLE_END_MS + 180;
export const REWARD_TOAST_DURATION_MS = 20_000;

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
    const arrivalTimer = window.setTimeout(() => setPhase('arrived'), REWARD_ARRIVAL_MS);
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
  const levelUp = reward.level > reward.previousLevel;
  const rankUp = reward.rankTitle !== reward.previousRankTitle;
  const streakChanged = reward.streak.weeks !== reward.streak.previousWeeks
    || reward.streak.hasVerifiedImpactThisWeek
      !== reward.streak.previousHasVerifiedImpactThisWeek;
  const milestone = levelUp || rankUp || reward.unlockedAchievements.length > 0
    || streakChanged;
  const title = reward.verificationMethod === 'EvidenceClaim'
    ? 'MISSION VERIFIED'
    : milestone ? 'CONGRATULATIONS!' : 'MISSION COMPLETE';
  const visibleTitle = title === 'MISSION VERIFIED'
    ? 'Mission Verified'
    : title === 'MISSION COMPLETE' ? 'Mission Complete' : 'Congratulations!';
  const timer = usePausableDismiss(onDismiss, REWARD_TOAST_DURATION_MS);
  const reduced = prefersReducedMotion(reward);
  const rewardMotionStyle = {
    '--kiwi-reward-xp-delay': `${REWARD_XP_DELAY_MS}ms`,
    '--kiwi-reward-level-arrow-delay': `${REWARD_LEVEL_ARROW_DELAY_MS}ms`,
    '--kiwi-reward-level-target-delay': `${REWARD_LEVEL_TARGET_DELAY_MS}ms`,
    '--kiwi-reward-achievement-delay': `${
      levelUp || rankUp
        ? REWARD_ACHIEVEMENT_WITH_LEVEL_DELAY_MS
        : REWARD_ACHIEVEMENT_NO_LEVEL_DELAY_MS
    }ms`,
  } as CSSProperties;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[70] flex justify-end sm:inset-x-auto sm:right-5 sm:w-[27rem]"
      data-reward-host
      style={rewardMotionStyle}
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
            <h2
              className="kiwi-reward-congratulation-heading flex w-full justify-center"
              data-reward-congratulation
            >
              <span className="sr-only">{title}</span>
              <svg
                aria-hidden="true"
                className="h-[4.75rem] w-[86%] overflow-visible"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 320 82"
              >
                <defs>
                  <linearGradient id="kiwi-congratulation-gold" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fff0a6" />
                    <stop offset="38%" stopColor="#f4c542" />
                    <stop offset="72%" stopColor="#dca21f" />
                    <stop offset="100%" stopColor="#b97808" />
                  </linearGradient>
                  <path
                    d="M 2 62 Q 160 10 318 62"
                    fill="none"
                    id="kiwi-congratulation-arc"
                  />
                </defs>
                <text
                  className="kiwi-reward-congratulation-text"
                  lengthAdjust="spacingAndGlyphs"
                  textLength="310"
                >
                  <textPath
                    href="#kiwi-congratulation-arc"
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    {visibleTitle}
                  </textPath>
                </text>
              </svg>
            </h2>

            <div className="-mt-1 flex items-center gap-3 pr-10">
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
                <h3 className="mt-1 text-xl">
                  {levelUp ? 'Level up!' : 'Quest complete!'}
                </h3>
                <p className="mt-1 truncate text-sm text-muted-content">{reward.questTitle}</p>
              </div>
            </div>

            <div
              className="mt-3 rounded-2xl border border-primary/20 bg-primary/8 p-3"
              data-reward-encouragement
            >
              <p className="font-extrabold text-base-content">{reward.celebrationTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-content">
                {reward.celebrationMessage}
              </p>
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
                <strong className="mt-0.5 inline-flex items-center gap-1.5 text-xl">
                  <Sparkles
                    aria-hidden="true"
                    className="kiwi-reward-gold-text size-5"
                    data-reward-xp-icon
                  />
                  <span
                    className={`kiwi-reward-gold-text inline-block ${
                      reduced ? '' : 'kiwi-reward-xp-value'
                    }`}
                    data-reward-xp-value
                  >
                    +{reward.xpAwarded} XP
                  </span>
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
                    <p
                      aria-label={`Level ${reward.previousLevel} to Level ${reward.level}`}
                      className="mt-1 flex items-baseline font-extrabold"
                    >
                      <span>Level {reward.previousLevel}</span>
                      <span
                        aria-hidden="true"
                        className={reduced ? 'mx-2' : 'kiwi-reward-level-arrow'}
                        data-reward-level-arrow
                      >
                        →
                      </span>
                      <span
                        aria-hidden="true"
                        className={reduced ? 'kiwi-reward-level-target-static' : 'kiwi-reward-level-target'}
                        data-reward-level-target
                      >
                        Level {reward.level}
                      </span>
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
              <div
                className="mt-3 rounded-2xl border border-warning/40 bg-warning/10 p-4"
                data-reward-achievement
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/20">
                    <Award aria-hidden="true" className="kiwi-reward-gold-text size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="kiwi-stat-label kiwi-reward-gold-text">Achievement unlocked</p>
                    {reward.unlockedAchievements.slice(0, 2).map((achievement) => (
                      <p
                        className={`kiwi-reward-gold-text mt-1 font-extrabold ${
                          reduced ? '' : 'kiwi-reward-achievement-stamp'
                        }`}
                        data-reward-achievement-title
                        key={achievement.achievementId}
                      >
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

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div
                className={`rounded-2xl border border-warning/25 bg-warning/8 p-3 ${
                  streakChanged && !reduced ? 'kiwi-reward-streak-pulse' : ''
                }`}
                data-reward-streak
              >
                <p className="flex items-center gap-1.5 font-extrabold text-warning">
                  <Flame aria-hidden="true" className="size-4" />
                  {reward.streak.weeks} week{reward.streak.weeks === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-xs text-muted-content">
                  {reward.streak.hasVerifiedImpactThisWeek
                    ? 'Weekly streak secured'
                    : 'Verified impact recorded'}
                </p>
              </div>
              <Link
                aria-label="Passport saved. View your Impact Passport"
                className="group grid grid-cols-[1fr_auto] overflow-hidden rounded-2xl border border-primary/20 bg-primary/8 transition-colors hover:border-primary/45 hover:bg-primary/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                data-reward-passport-link
                to="/passport"
              >
                <span className="p-3">
                  <span className="flex items-center gap-1.5 font-extrabold text-primary">
                    <Sparkles aria-hidden="true" className="size-4" />
                    Passport saved
                  </span>
                  <span className="mt-1 block text-xs text-muted-content sm:whitespace-nowrap">
                    Your record is updated
                  </span>
                </span>
                <span className="flex min-w-6 flex-col items-center justify-center gap-1 border-l border-primary/20 bg-primary/8 px-1.5 text-primary group-hover:bg-primary/12">
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </span>
              </Link>
            </div>

            {reward.communityChallenge && (
              <div className="mt-2 rounded-2xl border border-primary/25 bg-secondary/75 p-3" data-reward-community>
                <div className="flex items-center justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2 font-extrabold text-primary">
                    <Users aria-hidden="true" className="size-4 shrink-0" />
                    <span className="truncate">{reward.communityChallenge.communityName}</span>
                  </p>
                  <span className="kiwi-reward-gold-text shrink-0 font-extrabold">+1</span>
                </div>
                <p className="mt-1 text-xs text-muted-content">
                  Community Challenge {reward.communityChallenge.progress} / {reward.communityChallenge.target}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted-content">
              Full reward details stay on this Quest.
            </p>
            <Link
              className="btn btn-primary btn-sm shrink-0 rounded-full"
              to={`/quests/${reward.questId}`}
            >
              Review Quest
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="kiwi-reward-timer absolute bottom-0 left-0 h-0.5 bg-primary"
            data-reward-timer
            style={{
              animation: reduced
                ? 'none'
                : `kiwi-reward-timer ${REWARD_TOAST_DURATION_MS}ms linear forwards`,
              animationPlayState: timer.paused ? 'paused' : 'running',
            }}
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
  const particleRefs = useRef<Array<SVGSVGElement | null>>([]);

  useEffect(() => {
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
    const distance = Math.max(1, Math.hypot(dx, dy));
    const curveDepth = Math.min(110, Math.max(70, distance * 0.24));
    const controlX = dx * 0.5 + (-dy / distance) * curveDepth;
    const controlY = dy * 0.5 + (dx / distance) * curveDepth;
    const pointOnArc = (progress: number) => {
      const inverse = 1 - progress;
      return {
        x: 2 * inverse * progress * controlX + progress * progress * dx,
        y: 2 * inverse * progress * controlY + progress * progress * dy,
      };
    };
    const arcPoints = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
      .map((progress) => ({ progress, ...pointOnArc(progress) }));

    particleRefs.current.forEach((particle, index) => {
      if (!particle) return;
      particle.style.left = `${startX - REWARD_PARTICLE_SIZE_PX / 2}px`;
      particle.style.top = `${startY - REWARD_PARTICLE_SIZE_PX / 2}px`;
      arcPoints.forEach(({ progress, x, y }) => {
        const pointName = String(Math.round(progress * 100)).padStart(2, '0');
        particle.style.setProperty(`--kiwi-particle-p${pointName}-x`, `${x}px`);
        particle.style.setProperty(`--kiwi-particle-p${pointName}-y`, `${y}px`);
      });
      particle.style.setProperty('--kiwi-particle-end-x', `${dx}px`);
      particle.style.setProperty('--kiwi-particle-end-y', `${dy}px`);
      particle.style.setProperty(
        '--kiwi-particle-delay',
        `${REWARD_PARTICLE_INITIAL_DELAY_MS + index * REWARD_PARTICLE_STAGGER_MS}ms`,
      );
      particle.style.setProperty(
        '--kiwi-particle-duration',
        `${REWARD_PARTICLE_FIRST_DURATION_MS - index * REWARD_PARTICLE_DURATION_STEP_MS}ms`,
      );
      particle.dataset.ready = 'true';
    });
  }, [reduced, sourceRef]);

  if (reduced) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[71] overflow-visible"
      data-reward-particles
    >
      {Array.from({ length: REWARD_PARTICLE_COUNT }, (_, index) => (
        <svg
          aria-hidden="true"
          className="kiwi-reward-flight-sparkle kiwi-reward-particle fixed block"
          data-particle-shape="single-four-point-outline"
          data-reward-particle
          key={index}
          ref={(element) => { particleRefs.current[index] = element; }}
          viewBox="0 0 24 24"
        >
          <path
            d="M12 1.5C12.8 7.3 16.7 11.2 22.5 12C16.7 12.8 12.8 16.7 12 22.5C11.2 16.7 7.3 12.8 1.5 12C7.3 11.2 11.2 7.3 12 1.5Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="3.168"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ))}
    </div>
  );
}

function usePausableDismiss(onDismiss: () => void, duration: number) {
  const onDismissRef = useRef(onDismiss);
  const timeout = useRef<number | null>(null);
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const [paused, setPaused] = useState(false);

  const pause = useCallback(() => {
    if (timeout.current === null) return;
    window.clearTimeout(timeout.current);
    timeout.current = null;
    remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
    setPaused(true);
  }, []);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const resume = useCallback(() => {
    if (timeout.current !== null || remaining.current <= 0) return;
    startedAt.current = performance.now();
    setPaused(false);
    timeout.current = window.setTimeout(
      () => onDismissRef.current(),
      remaining.current,
    );
  }, []);

  useEffect(() => {
    remaining.current = duration;
    if (document.hidden) {
      setPaused(true);
    } else {
      resume();
    }
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

  return { pause, resume, paused };
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
