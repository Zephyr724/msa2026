import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  IdCard,
  Leaf,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QuestCard from '../components/quest/QuestCard.tsx';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useProgression } from '../hooks/useProgression.ts';
import { useQuestList } from '../hooks/useQuests.ts';

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

  return (
    <>
      <section className="kiwi-topography relative overflow-hidden border-b border-base-300/70 bg-base-200">
        <div className="kiwi-page grid gap-12 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-20 lg:py-24">
          <div className="relative z-10">
            <p className="kiwi-eyebrow">
              <Leaf aria-hidden="true" className="size-3.5" />
              Auckland-first eco adventures
            </p>
            <h1 className="kiwi-display mt-6 max-w-2xl text-5xl leading-[1.03] text-base-content sm:text-6xl">
              <span className="sr-only">Kiwimpact — </span>
              Turn local action into{' '}
              <span className="text-primary">lasting progress.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-base-content/68">
              Community eco quests across New Zealand. Discover local action,
              complete verified quests, earn XP, and build your Impact Passport.
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

            <div className="mt-8 flex flex-wrap gap-3">
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

          <HeroQuestPath />
        </div>
      </section>

      {auth.data && (
        <section className="border-b border-base-300/70 bg-secondary/45 py-10">
          <div className="kiwi-page">
            <MemberProgress displayName={auth.data.displayName} />
          </div>
        </section>
      )}

      <section className="bg-base-200 py-16 sm:py-20">
        <div className="kiwi-page">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="kiwi-stat-label">Start nearby</p>
              <h2 className="mt-2 text-3xl sm:text-4xl">Featured quests</h2>
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

      <section className="border-y border-base-300/70 bg-secondary/45 py-16 sm:py-20" id="how-it-works">
        <div className="kiwi-page">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="kiwi-stat-label">How it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">One connected loop</h2>
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

      <section className="kiwi-topography overflow-hidden bg-primary py-16 text-primary-content">
        <div className="kiwi-page grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] opacity-75">
              Your participation, recorded
            </p>
            <h2 className="mt-3 max-w-2xl text-4xl">Build your Impact Passport</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed opacity-80">
              Verified quests become a personal history of action, XP, level progress,
              rank titles, and achievements.
            </p>
          </div>
          <Link className="btn border-0 bg-primary-content text-primary hover:bg-primary-content/90" to={auth.data ? '/passport' : '/register'}>
            {auth.data ? 'Open Passport' : 'Create your Passport'}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function HeroQuestPath() {
  return (
    <div className="relative mx-auto min-h-[22rem] w-full max-w-[34rem]">
      <div className="kiwi-panel absolute inset-x-0 top-0 overflow-hidden p-5 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(111,214,154,0.18),transparent_30%),linear-gradient(135deg,transparent_30%,rgba(47,143,91,0.07)_30.5%,transparent_31%,transparent_64%,rgba(47,143,91,0.07)_64.5%,transparent_65%)]" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="kiwi-stat-label">Your quest path</p>
              <h2 className="mt-1 text-2xl">Start with one local action</h2>
            </div>
            <Sparkles aria-hidden="true" className="size-7 text-accent" />
          </div>
          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-3">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-primary">
                Discover
              </span>
              <img
                alt=""
                aria-hidden="true"
                className="mt-2 h-20 w-full rounded-xl object-cover"
                src="/images/quests/coastal-cleanup.svg"
              />
              <p className="mt-2 text-sm font-bold">Find a quest</p>
            </div>
            <ArrowRight aria-hidden="true" className="size-5 text-primary" />
            <div className="rounded-2xl border border-accent/35 bg-accent/10 p-3">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-warning">
                Progress
              </span>
              <div className="mt-2 grid h-20 place-items-center rounded-xl bg-primary/10">
                <Zap aria-hidden="true" className="size-9 text-accent" />
              </div>
              <p className="mt-2 text-sm font-bold">Earn verified XP</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-base-300 bg-secondary/65 p-3">
            <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <p className="text-sm font-semibold">Complete → earn → record → continue</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-5 rounded-full border border-accent/40 bg-base-100 px-4 py-2 text-sm font-extrabold shadow-xl sm:right-8">
        <span className="inline-flex items-center gap-2">
          <Zap aria-hidden="true" className="size-4 text-warning" />
          Verified progress
        </span>
      </div>
    </div>
  );
}

function MemberProgress({ displayName }: { displayName: string }) {
  const progression = useProgression();

  return (
    <div className="kiwi-panel kiwi-topography grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-content shadow-lg">
        <Leaf aria-hidden="true" className="size-7" />
      </span>
      <div>
        <p className="kiwi-stat-label">Welcome back</p>
        <h2 className="mt-1 text-3xl">{displayName}</h2>
        {progression.isPending && (
          <p aria-live="polite" className="mt-2 text-sm text-base-content/60">
            Loading your progress…
          </p>
        )}
        {progression.data && (
          <p className="mt-2 font-semibold text-base-content/65">
            Level {progression.data.level} · {progression.data.rankTitle} ·{' '}
            {progression.data.totalXp} XP
          </p>
        )}
        {progression.isError && (
          <p className="mt-2 text-sm text-base-content/60">
            Your progress will appear when it is available.
          </p>
        )}
      </div>
      <Link className="btn btn-primary rounded-full" to="/my-quests">
        Continue your quests <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
