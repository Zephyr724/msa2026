import {
  Award,
  CheckCircle2,
  ChevronUp,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useRewardFeedback } from '../components/reward/rewardFeedback.ts';
import type {
  CompletionRewardAchievementDto,
  CompletionRewardDto,
} from '../types/completion.ts';

interface RewardScenario {
  description: string;
  Icon: typeof CheckCircle2;
  label: string;
  questTitle: string;
  reward: Omit<CompletionRewardDto, 'rewardEventId' | 'questTitle'>;
  reducedMotion?: boolean;
}

const BUILDING_MOMENTUM: CompletionRewardAchievementDto = {
  achievementId: 'ed2faa73-1947-4b4b-826a-af7384d4ed10',
  code: 'verified-completions-3',
  name: 'Building Momentum',
};

const SCENARIOS: RewardScenario[] = [
  {
    label: 'Quest completion',
    description: 'Standard +50 XP flight with no level change.',
    Icon: CheckCircle2,
    questTitle: 'Waitākere Stream Care',
    reward: reward(50, 170, 220, 4, 4, 'Novice', 'Novice', [], false),
  },
  {
    label: 'Evidence approval',
    description: 'Asynchronous verification delivered through the durable reward inbox.',
    Icon: ShieldCheck,
    questTitle: 'Neighbourhood Waste Audit',
    reward: {
      ...reward(50, 170, 220, 4, 4, 'Novice', 'Novice', [], false),
      verificationMethod: 'EvidenceClaim',
    },
  },
  {
    label: 'Level up',
    description: 'XP arrives, then the Level 4 → 5 panel appears.',
    Icon: ChevronUp,
    questTitle: 'Native Seedling Survey',
    reward: reward(50, 220, 270, 4, 5, 'Novice', 'Novice'),
  },
  {
    label: 'Rank up',
    description: 'Crosses Level 10 and unlocks the Scout title.',
    Icon: Trophy,
    questTitle: 'Harbour Restoration Day',
    reward: reward(50, 740, 790, 9, 10, 'Novice', 'Scout'),
  },
  {
    label: 'Achievement unlock',
    description: 'Completion plus an authoritative achievement reveal.',
    Icon: Award,
    questTitle: 'Community Garden Working Bee',
    reward: reward(
      50,
      120,
      170,
      3,
      4,
      'Novice',
      'Novice',
      [BUILDING_MOMENTUM],
    ),
  },
  {
    label: 'Combined reward',
    description: 'Hard Quest, level up, rank up and achievement together.',
    Icon: Sparkles,
    questTitle: 'Rangitoto Conservation Expedition',
    reward: reward(
      150,
      740,
      890,
      9,
      10,
      'Novice',
      'Scout',
      [BUILDING_MOMENTUM],
    ),
  },
  {
    label: 'Reduced motion',
    description: 'Immediate state update with no particle flight or count-up.',
    Icon: ShieldCheck,
    questTitle: 'Accessible Reward Preview',
    reward: reward(50, 220, 270, 4, 5, 'Novice', 'Novice'),
    reducedMotion: true,
  },
];

export default function RewardLabPage() {
  const { activeReward, dismissReward, showReward } = useRewardFeedback();

  function preview(scenario: RewardScenario) {
    showReward({
      ...scenario.reward,
      rewardEventId: crypto.randomUUID(),
      questTitle: scenario.questTitle,
      preview: true,
      motionPreference: scenario.reducedMotion ? 'reduced' : 'full',
    });
  }

  return (
    <div className="kiwi-page py-10 sm:py-14">
      <header className="max-w-3xl">
        <span className="kiwi-eyebrow">
          <FlaskConical aria-hidden="true" className="size-4" />
          Development only
        </span>
        <h1 className="kiwi-page-heading mt-4">Reward Lab</h1>
        <p className="kiwi-page-intro mt-3">
          Preview every completion reward state without changing your real XP,
          level, achievements, Passport, or leaderboard position. Use the header
          theme switcher and a narrow viewport to verify dark and mobile variants.
          No sign-in is required in development.
        </p>
      </header>

      <section className="mt-8 rounded-3xl border border-info/25 bg-info/8 p-5" aria-label="Reward Lab instructions">
        <p className="font-extrabold">How to test the full design</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-relaxed text-muted-content">
          <li>Run each preview below and watch the preview XP target in the header.</li>
          <li>Close a toast manually, then let another close automatically after twenty seconds.</li>
          <li>Hover or focus the toast to confirm auto-dismiss pauses.</li>
          <li>Repeat in dark mode, at 320 px width, and with reduced motion.</li>
          <li>Sign in as a seeded demo member and use a real completion code to verify persisted rewards.</li>
        </ol>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.Icon;
          return (
            <article className="kiwi-panel flex flex-col p-5" key={scenario.label}>
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h2 className="mt-4 text-xl">{scenario.label}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-content">
                {scenario.description}
              </p>
              <button
                className="btn btn-primary mt-5 w-full"
                onClick={() => preview(scenario)}
                type="button"
              >
                Preview {scenario.label.toLowerCase()}
              </button>
            </article>
          );
        })}
      </div>

      {activeReward?.preview && (
        <button className="btn btn-outline mt-6" onClick={dismissReward} type="button">
          Dismiss current preview
        </button>
      )}
    </div>
  );
}

function reward(
  xpAwarded: number,
  previousTotalXp: number,
  totalXp: number,
  previousLevel: number,
  level: number,
  previousRankTitle: string,
  rankTitle: string,
  unlockedAchievements: CompletionRewardAchievementDto[] = [],
  streakChanged = true,
): Omit<CompletionRewardDto, 'rewardEventId' | 'questTitle'> {
  return {
    questCompletionId: '936b96fb-f895-42fa-8c53-008e37fc38f7',
    questId: '9ed6a4a5-631d-4b55-8203-72b760039c47',
    celebrationTitle: 'Well Done!',
    celebrationMessage: 'Your verified action is now part of the community impact story.',
    verificationMethod: 'CompletionCode',
    xpAwarded,
    previousTotalXp,
    totalXp,
    previousLevel,
    level,
    previousRankTitle,
    rankTitle,
    streak: {
      previousWeeks: streakChanged ? 2 : 3,
      previousHasVerifiedImpactThisWeek: !streakChanged,
      weeks: 3,
      hasVerifiedImpactThisWeek: true,
    },
    communityChallenge: null,
    unlockedAchievements,
    createdAtUtc: '2026-08-06T12:00:00.0000000Z',
    seenAtUtc: null,
  };
}
