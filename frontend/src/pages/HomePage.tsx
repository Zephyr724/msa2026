import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  IdCard,
  Leaf,
  Flame,
  Home,
  Map,
  MapPin,
  ShieldCheck,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QuestCard from '../components/quest/QuestCard.tsx';
import QuestImage from '../components/quest/QuestImage.tsx';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useProgression } from '../hooks/useProgression.ts';
import { useQuestList } from '../hooks/useQuests.ts';
import {
  useCommunityChallenges,
  useMyProfile,
  useWeeklyStreak,
} from '../hooks/useCommunity.ts';
import { useMyQuestParticipationsQuery } from '../hooks/useParticipation.ts';
import LevelProgress from '../components/passport/LevelProgress.tsx';
import { RankCrest } from '../components/game/GameArtwork.tsx';
import { questDiscoveryHighlight } from '../lib/questPresentation.ts';
import type { CommunityChallenge } from '../types/community.ts';

const loopSteps = [
  {
    number: '01',
    Icon: Compass,
    title: 'Discover a quest',
    description: 'Browse real local opportunities by category, location, and difficulty.',
  },
  {
    number: '02',
    Icon: Target,
    title: 'Join and take part',
    description: 'Save a quest to your Mission Board and show up for the activity.',
  },
  {
    number: '03',
    Icon: ShieldCheck,
    title: 'Complete with a code',
    description: 'Use the organizer’s completion code to record a verified result.',
  },
  {
    number: '04',
    Icon: Zap,
    title: 'Earn XP',
    description: 'Verified completions add server-authoritative XP and progression.',
  },
  {
    number: '05',
    Icon: Award,
    title: 'Unlock achievements',
    description: 'Build a collection of milestones as your verified record grows.',
  },
  {
    number: '06',
    Icon: IdCard,
    title: 'Grow your Passport',
    description: 'Keep your personal history, level, rank, and achievements together.',
  },
];

export default function HomePage() {
  const auth = useAuthQuery();
  const featured = useQuestList({ page: 1, pageSize: 3, sortBy: 'startAt' });
  const challenges = useCommunityChallenges();
  const profile = useMyProfile(Boolean(auth.data));
  // Prefer the signed-in member's community goal; guests and members without
  // a Home Community receive the first active public challenge.
  const primaryChallenge = challenges.data?.find(
    (challenge) => challenge.localArea.id === profile.data?.homeCommunity?.id,
  ) ?? challenges.data?.[0];

  return (
    <>
      <section className="kiwi-topography relative overflow-hidden border-b border-base-300/70 bg-base-200">
        <div className="kiwi-page grid gap-10 py-10 md:grid-cols-2 md:items-start md:py-12">
          <div className="relative z-10">
            <p className="kiwi-eyebrow">
              <Leaf aria-hidden="true" className="size-3.5" />
              Auckland-first eco adventures
            </p>
            <h1 className="kiwi-display mt-5 max-w-2xl text-4xl leading-[1.08] text-base-content md:text-5xl">
              <span className="sr-only">Kiwimpact — </span>
              Turn local action into{' '}
              <span className="text-primary">lasting progress.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-content">
              Discover eco quests near you, get verified, earn XP, and build
              your Impact Passport — together.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-content">
              {['Discover', 'Join', 'Complete', 'Earn XP', 'Grow Passport'].map(
                (step, index) => (
                  <span className="inline-flex items-center gap-2" key={step}>
                    <span className={index < 2 ? 'badge badge-primary badge-outline' : 'badge badge-outline'}>
                      {step}
                    </span>
                    {index < 4 && <ArrowRight aria-hidden="true" className="size-3 opacity-45" />}
                  </span>
                ),
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn btn-primary rounded-full px-6" to="/quests">
                Explore quests <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              {auth.data ? (
                <Link className="btn btn-outline rounded-full px-6" to="/my-quests">
                  View My Quests
                </Link>
              ) : (
                <Link className="btn btn-outline rounded-full px-6" to="/register">
                  Join free
                </Link>
              )}
            </div>
          </div>

          <HeroMapPreview />
        </div>
      </section>

      <section className="border-b border-base-300/70 bg-secondary/45 py-12">
        <div className="kiwi-page grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {auth.data ? (
            <MemberProgress displayName={auth.data.displayName} />
          ) : (
            <GuestProgressPreview />
          )}
          <CompactCommunityGoal
            challenge={primaryChallenge}
            error={challenges.isError}
            loading={challenges.isPending}
          />
        </div>
      </section>

      <section className="bg-base-200 py-14">
        <div className="kiwi-page">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="kiwi-stat-label">Start nearby</p>
              <h2 className="mt-1 text-2xl">Featured quests</h2>
              <p className="mt-2 text-muted-content">
                Real opportunities from the current Kiwimpact quest catalogue.
              </p>
            </div>
            <Link className="btn btn-outline btn-sm hidden rounded-full sm:inline-flex" to="/quests">
              View all <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          {featured.isPending && (
            <div aria-live="polite" className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="skeleton h-[28rem] rounded-[1.35rem]" key={index} />
              ))}
            </div>
          )}
          {featured.isError && (
            <div className="kiwi-panel flex flex-col items-start gap-3 p-6" role="status">
              <p className="font-semibold">Featured quests are taking a little longer to load.</p>
              <Link className="btn btn-primary btn-sm" to="/quests">
                Open Discover
              </Link>
            </div>
          )}
          {featured.data && featured.data.items.length > 0 && (
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {featured.data.items.map((quest) => (
                <div className="w-[84vw] max-w-sm shrink-0 snap-center md:w-auto md:max-w-none" key={quest.id}>
                  <QuestCard
                    highlightLabel={questDiscoveryHighlight(quest)}
                    quest={quest}
                  />
                </div>
              ))}
            </div>
          )}
          {featured.data?.items.length === 0 && (
            <div className="kiwi-panel p-8 text-center">
              <p className="font-semibold">New quests are being prepared.</p>
              <p className="mt-1 text-sm text-muted-content">Check Discover again soon.</p>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-base-300/70 bg-secondary/45 py-16" id="how-it-works">
        <div className="kiwi-page">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="kiwi-stat-label">How it works</p>
            <h2 className="mt-2 text-2xl">One connected loop</h2>
            <p className="mt-3 text-muted-content">
              Every verified step builds a clearer record of your participation.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loopSteps.map(({ number, Icon, title, description }) => (
              <article className="kiwi-panel relative min-h-48 p-6" key={number}>
                <span className="absolute right-5 top-4 kiwi-display text-3xl text-base-300">
                  {number}
                </span>
                <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-content">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PassportShowcase signedIn={Boolean(auth.data)} />

      {!auth.data && (
        <section className="kiwi-topography overflow-hidden bg-primary py-16 text-primary-content">
          <div className="kiwi-page text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] opacity-75">
              Your first local action can start today
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-4xl">
              Join a community that turns participation into progress
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed opacity-80">
              Create your free account, choose a real Quest, and begin a
              privacy-aware Impact Passport you control.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link className="btn border-0 bg-primary-content text-primary hover:bg-primary-content/90" to="/register">
                Join Kiwimpact <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link className="btn border-primary-content/40 bg-transparent text-primary-content hover:bg-primary-content/10" to="/quests">
                Browse quests
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-base-300 bg-neutral py-10 text-neutral-content">
        <div className="kiwi-page grid gap-8 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <p className="inline-flex items-center gap-2 text-lg font-extrabold">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-content">
                <Leaf aria-hidden="true" className="size-4" />
              </span>
              Kiwimpact
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-65">
              Auckland-first community action, verified progress, and a
              personal record that stays grounded in real participation.
            </p>
          </div>
          <nav aria-label="Explore" className="grid content-start gap-2 text-sm">
            <p className="font-extrabold">Explore</p>
            <Link aria-label="Discover quests — footer" className="opacity-70 hover:opacity-100" to="/quests">
              Discover quests
            </Link>
            <Link aria-label="Leaderboard — footer" className="opacity-70 hover:opacity-100" to="/leaderboard">
              Leaderboard
            </Link>
          </nav>
          <nav aria-label="Account" className="grid content-start gap-2 text-sm">
            <p className="font-extrabold">Your journey</p>
            <Link
              aria-label={auth.data ? 'Mission Board — footer' : 'Join Kiwimpact — footer'}
              className="opacity-70 hover:opacity-100"
              to={auth.data ? '/my-quests' : '/register'}
            >
              {auth.data ? 'Mission Board' : 'Join Kiwimpact'}
            </Link>
            <Link
              aria-label={auth.data ? 'Impact Passport — footer' : 'Sign in — footer'}
              className="opacity-70 hover:opacity-100"
              to={auth.data ? '/passport' : '/login'}
            >
              {auth.data ? 'Impact Passport' : 'Sign in'}
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

function HeroMapPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem]">
      <Link
        aria-label="Explore quests on the Auckland map"
        className="group block overflow-hidden rounded-[1.25rem] border border-base-300 bg-base-100 shadow-sm transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        to="/quests"
      >
        <div className="relative h-[17rem] overflow-hidden bg-[#e8f3e4] dark:bg-[#1B2C24] md:h-[18rem]">
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 800 400"
          >
            <path
              className="dark:stroke-[#365144]"
              d="M0 200 Q200 180 400 200 T800 200"
              stroke="#c8dfc4"
              strokeWidth="6"
            />
            <path
              className="dark:stroke-[#365144]"
              d="M400 0 Q380 200 400 400"
              stroke="#c8dfc4"
              strokeWidth="4"
            />
            <path
              className="dark:stroke-[#2a4234]"
              d="M100 100 Q300 120 500 80 Q650 60 800 100"
              stroke="#d5e8d0"
              strokeWidth="3"
            />
            <path
              className="dark:stroke-[#2a4234]"
              d="M0 300 Q250 320 500 300 Q700 280 800 310"
              stroke="#d5e8d0"
              strokeWidth="3"
            />
            <ellipse
              className="dark:opacity-20"
              cx="650"
              cy="80"
              fill="#b8d4e8"
              opacity=".4"
              rx="120"
              ry="60"
            />
          </svg>
          <span className="absolute left-[18%] top-[35%] grid size-9 place-items-center rounded-full border-[3px] border-base-100 bg-primary text-primary-content shadow-lg">
            <Leaf className="size-4" />
          </span>
          <span className="absolute right-[18%] top-[24%] grid size-9 place-items-center rounded-full border-[3px] border-base-100 bg-primary/80 text-primary-content shadow-lg">
            <MapPin className="size-4" />
          </span>
          <span className="absolute bottom-[21%] left-[48%] grid size-9 place-items-center rounded-full border-[3px] border-base-100 bg-primary/80 text-primary-content shadow-lg">
            <Trophy className="size-4" />
          </span>
          <div className="absolute inset-x-3 top-3 flex items-center justify-between rounded-xl bg-base-100/92 px-3 py-2 shadow-sm backdrop-blur">
            <div>
              <p className="kiwi-stat-label">Auckland quest map</p>
              <p className="text-sm font-extrabold">Local action is closer than you think</p>
            </div>
            <Map aria-hidden="true" className="size-5 text-primary" />
          </div>
          <span className="btn btn-primary btn-sm absolute bottom-4 right-4 rounded-full shadow-lg">
            Explore the map <ArrowRight aria-hidden="true" className="size-4" />
          </span>
        </div>
      </Link>
      <div className="absolute -bottom-4 left-5 rounded-full border border-accent/40 bg-base-100 px-4 py-2 text-sm font-extrabold shadow-xl">
        <span className="inline-flex items-center gap-2">
          <Flame aria-hidden="true" className="size-4 text-warning" />
          Build a weekly streak
        </span>
      </div>
    </div>
  );
}

function GuestProgressPreview() {
  return (
    <article className="kiwi-panel kiwi-topography flex h-full flex-col overflow-hidden p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kiwi-stat-label">Personal progress</p>
          <h2 className="mt-2 text-3xl">Start with one real action</h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-content">
            Your dashboard begins empty and grows only from verified Quest
            activity—no demo rank, streak, or impact is invented.
          </p>
        </div>
        <RankCrest rankTitle="Novice" size={62} />
      </div>
      <div className="mt-7 grid grid-cols-3 gap-3">
        {[
          ['0', 'Verified'],
          ['0', 'XP'],
          ['0', 'Achievements'],
        ].map(([value, label]) => (
          <div className="rounded-2xl border border-base-300 bg-base-100/85 p-4 text-center" key={label}>
            <span className="kiwi-display text-2xl text-primary">{value}</span>
            <span className="mt-1 block text-xs font-bold text-muted-content">{label}</span>
          </div>
        ))}
      </div>
      <Link className="btn btn-primary mt-7 self-start rounded-full" to="/register">
        Start your progress <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}

function PassportShowcase({ signedIn }: { signedIn: boolean }) {
  const passportFeatures = [
    {
      Icon: ShieldCheck,
      title: 'Verified Quest history',
      detail: 'A record backed by completion codes or approved evidence',
      meta: 'Verified',
    },
    {
      Icon: TrendingUp,
      title: 'XP and level progress',
      detail: 'Server-authoritative XP with a visible path to the next level',
      meta: 'Levels 1–99',
    },
    {
      Icon: Award,
      title: 'Milestone achievements',
      detail: 'Earned from rewarded, verified completion milestones',
      meta: '3 live',
    },
    {
      Icon: Flame,
      title: 'Weekly streak',
      detail: 'Keep momentum with at least one verified Quest each week',
      meta: 'Weekly',
    },
    {
      Icon: Users,
      title: 'Community contribution',
      detail: 'See how verified local action adds to a shared goal',
      meta: 'Local',
    },
  ] as const;

  return (
    <section className="kiwi-topography overflow-hidden bg-primary py-16 text-primary-content sm:py-20">
      <div className="kiwi-page">
        <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="max-w-xl text-3xl sm:text-4xl">Build your Impact Passport</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-primary-content/80">
              Every verified Quest adds to your Passport — a personal record
              that is yours to keep and share.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                [TrendingUp, 'Levels 1–99', 'Level progression'],
                [Award, '3 milestones', 'Achievement badges'],
                [Flame, 'Weekly', 'Streak tracking'],
                [Users, 'Local', 'Community progress'],
              ].map(([Icon, value, label]) => {
                const FeatureIcon = Icon as typeof TrendingUp;
                return (
                  <div
                    className="flex items-center gap-3 rounded-2xl border border-primary-content/10 bg-primary-content/10 p-4"
                    key={label as string}
                  >
                    <FeatureIcon aria-hidden="true" className="size-5 shrink-0 opacity-80" />
                    <span>
                      <strong className="block text-sm">{value as string}</strong>
                      <span className="block text-xs opacity-70">{label as string}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <Link
              className="btn mt-7 rounded-full border-0 bg-primary-content text-primary hover:bg-primary-content/90"
              to={signedIn ? '/passport' : '/register'}
            >
              {signedIn ? 'Open your Passport' : 'Create your Passport'}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {passportFeatures.map(({ Icon, title, detail, meta }, index) => (
              <div
                className="flex items-center gap-3.5 rounded-2xl border border-primary-content/10 bg-primary-content/10 p-3.5"
                key={title}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-content/12 text-accent">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-extrabold">{title}</p>
                    {index === 0 ? (
                      <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-accent" />
                    ) : (
                      <span className="shrink-0 text-xs text-primary-content/60">{meta}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-primary-content/66">{detail}</p>
                  {index > 0 && index < 3 && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary-content/15">
                      <span
                        className="block h-full rounded-full bg-accent/85"
                        style={{ width: index === 1 ? '55%' : '35%' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompactCommunityGoal({
  challenge,
  error,
  loading,
}: {
  challenge?: CommunityChallenge;
  error: boolean;
  loading: boolean;
}) {
  const percentage = challenge ? Math.min(100, Math.max(0, challenge.progressPercentage)) : 0;
  const remaining = challenge
    ? Math.max(0, challenge.targetValue - challenge.currentProgress)
    : 0;
  const daysRemaining = challenge
    ? Math.max(
        0,
        Math.ceil(
          (new Date(challenge.periodEndUtc).getTime() - Date.now())
          / (24 * 60 * 60 * 1000),
        ),
      )
    : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="kiwi-stat-label">Community Goal</p>
          <h2 className="mt-1 text-xl">
            {challenge
              ? `${challenge.localArea.name} Challenge`
              : 'Your local community challenge'}
          </h2>
        </div>
        {challenge && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {daysRemaining} days left
          </span>
        )}
      </div>
      <article className="flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-base-300 bg-base-100 shadow-sm">
        <div className="h-28 overflow-hidden">
          <QuestImage
            alt=""
            category="RestoreNature"
            className="h-full w-full object-cover"
            height={224}
            source={null}
            title={challenge
              ? `${challenge.localArea.name} community challenge`
              : 'Auckland community challenge'}
            width={960}
          />
        </div>
        <div className="flex flex-1 flex-col space-y-3 p-5">
        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-base-200" />
        ) : challenge ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kiwi-stat-label">Community Challenge</p>
                <h3 className="mt-1 text-lg">{challenge.localArea.name}</h3>
                <p className="mt-1 text-sm text-muted-content">
                  Complete {challenge.targetValue} verified Quests during this challenge
                </p>
              </div>
            </div>
            <progress
              aria-label={`${challenge.localArea.name} community challenge progress`}
              className="progress progress-primary h-3"
              max="100"
              value={percentage}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="font-extrabold text-primary">
                {challenge.currentProgress} / {challenge.targetValue}
              </span>
              <span className="text-xs text-muted-content">
                {remaining} {remaining === 1 ? 'Quest' : 'Quests'} remaining
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-base-300 bg-secondary p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/18 text-warning">
                <Award aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="block text-xs font-extrabold">Reward: community milestone badge</span>
                <span className="mt-0.5 block text-xs text-muted-content">
                  For contributors when the community reaches its goal
                </span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-content">
              Any verified Quest attributed to {challenge.localArea.name} during
              the challenge automatically counts. Self-reported completions do not.
            </p>
          </>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-muted-content">
            {error
              ? 'Community progress is temporarily unavailable.'
              : 'The next community challenge will appear here when it begins.'}
          </p>
        )}
        <Link
          className="mt-auto inline-flex items-center gap-1 self-start text-sm font-bold text-primary hover:underline"
          to="/my-quests#community-challenge"
        >
          View challenge details <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        </div>
      </article>
    </div>
  );
}

function MemberProgress({ displayName }: { displayName: string }) {
  const progression = useProgression();
  const profile = useMyProfile();
  const streak = useWeeklyStreak();
  const participations = useMyQuestParticipationsQuery('active');

  return (
    <div className="kiwi-panel kiwi-topography h-full overflow-hidden">
      <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
        {progression.data ? (
          <RankCrest rankTitle={progression.data.rankTitle} size={64} />
        ) : (
          <RankCrest rankTitle="Novice" size={64} />
        )}
        <div>
          <p className="kiwi-stat-label">Welcome back</p>
          <h2 className="mt-1 text-3xl">{displayName}</h2>
          {progression.isPending && (
            <p aria-live="polite" className="mt-2 text-sm text-muted-content">
              Loading your progress…
            </p>
          )}
          {progression.data && (
            <>
              <p className="mt-2 font-semibold text-muted-content">
                Level {progression.data.level} · {progression.data.rankTitle} ·{' '}
                {progression.data.totalXp} XP
              </p>
              <div className="mt-4 max-w-xl">
                <LevelProgress progression={progression.data} />
              </div>
            </>
          )}
          {progression.isError && (
            <p className="mt-2 text-sm text-muted-content">
              Your progress will appear when it is available.
            </p>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2">
          <Link className="btn btn-primary rounded-full" to="/my-quests">
            Continue your quests <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link className="btn btn-ghost btn-sm rounded-full" to="/passport">
            Open Passport
          </Link>
        </div>
      </div>

      <div className="grid border-t border-base-300 md:grid-cols-3">
        <MomentumStat
          Icon={Target}
          label="Active missions"
          value={participations.data
            ? String(participations.data.length)
            : participations.isError ? '—' : '…'}
          to="/my-quests"
        />
        <MomentumStat
          Icon={Flame}
          label="Verified weekly streak"
          value={streak.data
            ? `${streak.data.currentWeeks} weeks`
            : streak.isError ? '—' : '…'}
          to="/passport"
        />
        <MomentumStat
          Icon={Home}
          label="Home Community"
          value={profile.data?.homeCommunity?.name
            ?? (profile.isError ? 'Unavailable' : profile.isPending ? '…' : 'Choose one')}
          to="/passport"
        />
      </div>
    </div>
  );
}

function MomentumStat({
  Icon,
  label,
  to,
  value,
}: {
  Icon: typeof Target;
  label: string;
  to: string;
  value: string;
}) {
  return (
    <Link
      className="flex items-center gap-3 border-b border-base-300 p-5 transition-colors hover:bg-secondary/70 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
      to={to}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="kiwi-stat-label block">{label}</span>
        <span className="mt-1 block truncate font-extrabold">{value}</span>
      </span>
    </Link>
  );
}
