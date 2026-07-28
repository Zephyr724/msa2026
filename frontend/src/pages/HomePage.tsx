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
import { RepositoryQuestScene } from '../components/quest/QuestCard.tsx';
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
      <Link
        aria-label="Explore quests on the Auckland map"
        className="group block overflow-hidden rounded-[1.25rem] border border-base-300 bg-base-100 shadow-sm transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        to="/quests"
      >
        <div className="relative h-[17rem] overflow-hidden bg-[#dcefdc] md:h-[18rem]">
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
    <section className="kiwi-topography overflow-hidden bg-primary py-14 text-primary-content sm:py-16">
      <div className="kiwi-page">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] opacity-70">
              Your impact identity
            </p>
            <h2 className="mt-2 max-w-xl text-4xl">Build your Impact Passport</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed opacity-78">
              Keep your verified completions, XP, rank, achievements, and
              community contribution in one living record.
            </p>
            <Link
              className="btn mt-7 rounded-full border-0 bg-primary-content text-primary hover:bg-primary-content/90"
              to={signedIn ? '/passport' : '/register'}
            >
              {signedIn ? 'Open your Passport' : 'Create your Passport'}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-[1.25rem] border border-primary-content/20 bg-base-100 text-base-content shadow-xl">
            <div className="flex items-center gap-4 border-b border-base-300 p-5">
              <span className="grid size-[4.125rem] place-items-center rounded-[1.35rem] bg-primary/12 text-primary">
                <IdCard aria-hidden="true" className="size-8" />
              </span>
              <div>
                <p className="kiwi-stat-label">Passport preview</p>
                <p className="mt-1 text-2xl font-extrabold">A record you can stand behind</p>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-base-300 sm:grid-cols-4">
              {[
                ['Quest log', 'Verified'],
                ['XP ledger', 'Authoritative'],
                ['Rank path', 'Progressive'],
                ['Badge case', 'Earned'],
              ].map(([value, label], index) => (
                <div
                  className={`p-4 text-center ${
                    index < 3 ? 'border-r border-base-300' : ''
                  } ${index < 2 ? 'max-sm:border-b' : ''}`}
                  key={label}
                >
                  <span className="kiwi-display block text-xl text-primary">{value}</span>
                  <span className="mt-1 block text-xs font-bold text-base-content/55">{label}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {[
                [ShieldCheck, 'Verified history'],
                [Sparkles, 'Achievement trail'],
                [Users, 'Community context'],
              ].map(([Icon, title]) => {
                const PassportIcon = Icon as typeof ShieldCheck;
                return (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/60 p-3" key={title as string}>
                    <PassportIcon aria-hidden="true" className="size-5 text-primary" />
                    <span className="text-xs font-extrabold">{title as string}</span>
                  </div>
                );
              })}
            </div>
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
    <article className="h-full overflow-hidden rounded-[1.25rem] border border-base-300 bg-base-100 shadow-sm">
      <div className="relative h-28 overflow-hidden">
        <RepositoryQuestScene category="RestoreNature" title="Auckland community goal" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 text-white">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/75">
              Community Goal
            </p>
            <h2 className="mt-1 text-2xl text-white">
              {challenge ? `${challenge.localArea.name} moves together` : 'A shared local goal'}
            </h2>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 backdrop-blur">
            <Trophy aria-hidden="true" className="size-5" />
          </span>
        </div>
      </div>
      <div className="flex min-h-[18rem] flex-col p-6">

        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-base-200" />
        ) : challenge ? (
          <>
            <div className="flex items-end justify-between gap-5">
              <div>
                <span className="kiwi-display text-4xl text-primary">{challenge.currentProgress}</span>
                <span className="ml-2 text-sm font-bold text-base-content/62">
                  of {challenge.targetValue} verified actions
                </span>
              </div>
              <span className="text-sm font-extrabold">{Math.round(percentage)}%</span>
            </div>
            <progress
              aria-label={`${challenge.localArea.name} community challenge progress`}
              className="progress progress-primary mt-3 h-3"
              max="100"
              value={percentage}
            />
            <p className="mt-4 text-sm leading-relaxed text-base-content/65">
              {challenge.isPrivacyProtected
                ? 'Contributor details stay private until the community threshold is met.'
                : `${challenge.activeContributors ?? 0} local contributors are taking part.`}
            </p>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <span>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-amber-700">Community reward</span>
                <span className="mt-1 block text-sm font-bold">Unlock the shared milestone badge</span>
              </span>
              <Award aria-hidden="true" className="size-7 text-amber-600" />
            </div>
          </>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-base-content/65">
            {error
              ? 'Community progress is temporarily unavailable.'
              : 'The next community challenge will appear here when it begins.'}
          </p>
        )}
        <Link className="btn btn-outline btn-sm mt-auto self-start rounded-full border-primary/45 text-primary hover:bg-primary hover:text-primary-content" to="/leaderboard">
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
