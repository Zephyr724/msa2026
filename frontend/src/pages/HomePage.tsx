import {
  ArrowRight,
  Award,
  Compass,
  IdCard,
  Leaf,
  Flame,
  Home,
  Map,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QuestCard from '../components/quest/QuestCard.tsx';
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
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-base-content/68">
              Discover eco quests near you, get verified, earn XP, and build
              your Impact Passport — together.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-bold text-base-content/58">
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
            challenge={challenges.data?.[0]}
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
              <p className="mt-2 text-base-content/62">
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
                  <QuestCard quest={quest} />
                </div>
              ))}
            </div>
          )}
          {featured.data?.items.length === 0 && (
            <div className="kiwi-panel p-8 text-center">
              <p className="font-semibold">New quests are being prepared.</p>
              <p className="mt-1 text-sm text-base-content/60">Check Discover again soon.</p>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-base-300/70 bg-secondary/45 py-16" id="how-it-works">
        <div className="kiwi-page">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="kiwi-stat-label">How it works</p>
            <h2 className="mt-2 text-2xl">One connected loop</h2>
            <p className="mt-3 text-base-content/62">
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
                <p className="mt-2 text-sm leading-relaxed text-base-content/62">{description}</p>
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
      <div className="overflow-hidden rounded-[1.25rem] border border-primary/15 bg-base-100 p-2 shadow-sm">
        <div className="relative h-[17rem] overflow-hidden rounded-[1rem] border border-primary/15 bg-[#dcefdc] md:h-[18rem]">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-90"
            style={{
              backgroundImage:
                'linear-gradient(34deg, transparent 44%, rgba(255,255,255,.8) 45%, rgba(255,255,255,.8) 50%, transparent 51%), linear-gradient(-32deg, transparent 36%, rgba(255,255,255,.65) 37%, rgba(255,255,255,.65) 41%, transparent 42%), radial-gradient(circle at 20% 18%, #bad9f3 0 13%, transparent 13.5%), radial-gradient(circle at 82% 80%, #b9d6f1 0 18%, transparent 18.5%)',
              backgroundSize: '180px 150px, 210px 180px, auto, auto',
            }}
          />
          <div aria-hidden="true" className="absolute -left-8 top-28 h-24 w-[125%] rotate-[-7deg] rounded-full border-[18px] border-[#a8d29f]/80" />
          <span className="absolute left-[18%] top-[35%] grid size-9 place-items-center rounded-full border-[3px] border-base-100 bg-primary text-primary-content shadow-lg">
            <Leaf className="size-4" />
          </span>
          <span className="absolute right-[18%] top-[24%] grid size-9 place-items-center rounded-full border-[3px] border-base-100 bg-[#3c72c9] text-white shadow-lg">
            <MapPin className="size-4" />
          </span>
          <span className="absolute bottom-[21%] left-[48%] grid size-9 place-items-center rounded-full border-[3px] border-base-100 bg-[#d4a020] text-white shadow-lg">
            <Trophy className="size-4" />
          </span>
          <div className="absolute inset-x-3 top-3 flex items-center justify-between rounded-xl bg-base-100/92 px-3 py-2 shadow-sm backdrop-blur">
            <div>
              <p className="kiwi-stat-label">Auckland quest map</p>
              <p className="text-sm font-extrabold">Local action is closer than you think</p>
            </div>
            <Map aria-hidden="true" className="size-5 text-primary" />
          </div>
          <Link
            className="btn btn-primary btn-sm absolute bottom-4 right-4 rounded-full shadow-lg"
            to="/quests"
          >
            Explore the map <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
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
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-base-content/62">
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
            <span className="mt-1 block text-xs font-bold text-base-content/58">{label}</span>
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
  return (
    <section className="overflow-hidden bg-base-200 py-16 sm:py-20">
      <div className="kiwi-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="kiwi-stat-label">Impact Passport</p>
          <h2 className="mt-2 max-w-xl text-4xl">
            A lasting record of the action you can stand behind
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-base-content/65">
            Verified completions, XP, rank, achievements, and community
            participation share one truthful history. Self-reported activity
            stays clearly labelled and never earns verified rewards.
          </p>
          <Link className="btn btn-primary mt-7 rounded-full" to={signedIn ? '/passport' : '/register'}>
            {signedIn ? 'Open your Passport' : 'Create your Passport'}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="kiwi-panel kiwi-topography relative overflow-hidden p-6 sm:p-8">
          <div className="flex items-center gap-4 border-b border-base-300 pb-5">
            <RankCrest rankTitle="Explorer" size={68} />
            <div>
              <p className="kiwi-stat-label">Passport preview</p>
              <p className="mt-1 text-2xl font-extrabold">Your local impact identity</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [ShieldCheck, 'Verified history', 'Only trusted completions earn XP'],
              [Sparkles, 'Achievement trail', 'Milestones stay visible over time'],
              [Users, 'Community context', 'Privacy thresholds remain authoritative'],
            ].map(([Icon, title, description]) => {
              const PassportIcon = Icon as typeof ShieldCheck;
              return (
                <article className="rounded-2xl border border-base-300 bg-base-100/88 p-4" key={title as string}>
                  <PassportIcon aria-hidden="true" className="size-5 text-primary" />
                  <h3 className="mt-3 text-base">{title as string}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-base-content/58">
                    {description as string}
                  </p>
                </article>
              );
            })}
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

  return (
    <article className="kiwi-panel relative h-full overflow-hidden bg-primary text-primary-content">
      <div className="absolute -right-16 -top-16 size-56 rounded-full border-[36px] border-primary-content/5" />
      <div className="relative flex h-full flex-col p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] opacity-70">
              Community challenge
            </p>
            <h2 className="mt-2 text-3xl">
              {challenge ? `${challenge.localArea.name} moves together` : 'A shared local goal'}
            </h2>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-content/12">
            <Trophy aria-hidden="true" className="size-6" />
          </span>
        </div>

        {loading ? (
          <div className="mt-8 h-24 animate-pulse rounded-2xl bg-primary-content/10" />
        ) : challenge ? (
          <>
            <div className="mt-8 flex items-end justify-between gap-5">
              <div>
                <span className="kiwi-display text-4xl">{challenge.currentProgress}</span>
                <span className="ml-2 text-sm font-bold opacity-72">
                  of {challenge.targetValue} verified actions
                </span>
              </div>
              <span className="text-sm font-extrabold">{Math.round(percentage)}%</span>
            </div>
            <progress
              aria-label={`${challenge.localArea.name} community challenge progress`}
              className="progress progress-accent mt-3 h-3 bg-primary-content/15"
              max="100"
              value={percentage}
            />
            <p className="mt-4 text-sm leading-relaxed opacity-75">
              {challenge.isPrivacyProtected
                ? 'Contributor details stay private until the community threshold is met.'
                : `${challenge.activeContributors ?? 0} local contributors are taking part.`}
            </p>
          </>
        ) : (
          <p className="mt-8 max-w-md text-sm leading-relaxed opacity-75">
            {error
              ? 'Community progress is temporarily unavailable.'
              : 'The next community challenge will appear here when it begins.'}
          </p>
        )}
        <Link className="btn mt-auto self-start border-0 bg-primary-content text-primary hover:bg-primary-content/90" to="/leaderboard">
          View community impact <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
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
            <p aria-live="polite" className="mt-2 text-sm text-base-content/60">
              Loading your progress…
            </p>
          )}
          {progression.data && (
            <>
              <p className="mt-2 font-semibold text-base-content/65">
                Level {progression.data.level} · {progression.data.rankTitle} ·{' '}
                {progression.data.totalXp} XP
              </p>
              <div className="mt-4 max-w-xl">
                <LevelProgress progression={progression.data} />
              </div>
            </>
          )}
          {progression.isError && (
            <p className="mt-2 text-sm text-base-content/60">
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
