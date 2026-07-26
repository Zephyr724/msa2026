import {
  ArrowRight,
  CheckCircle2,
  Compass,
  History,
  Target,
  Zap,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PlayerStatusSummary from '../components/PlayerStatusSummary.tsx';
import QuestCard from '../components/quest/QuestCard.tsx';
import { useMyQuestParticipationsQuery } from '../hooks/useParticipation.ts';
import type { MyQuestParticipationFilter } from '../types/participation.ts';

const tabs: Array<{
  value: MyQuestParticipationFilter;
  label: string;
}> = [
  { value: 'all', label: 'All quests' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
];

function isFilter(value: string | null): value is MyQuestParticipationFilter {
  return value === 'active' || value === 'cancelled' || value === 'all';
}

export default function MyQuestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status');
  const status = isFilter(rawStatus) ? rawStatus : 'all';
  const participations = useMyQuestParticipationsQuery(status);

  function setStatus(next: MyQuestParticipationFilter) {
    setSearchParams(next === 'all' ? {} : { status: next });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
      <main className="kiwi-page">
        <header>
          <p className="kiwi-stat-label">Your next steps</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Mission Board</h1>
          <p className="mt-3 max-w-2xl text-lg text-base-content/62">
            Keep your joined quests together and return when you are ready to complete them.
          </p>
        </header>

        <div className="mt-8">
          <PlayerStatusSummary />
        </div>

        <section className="mt-9" aria-labelledby="mission-list-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="kiwi-stat-label">Quest path</p>
              <h2 className="mt-1 text-2xl" id="mission-list-title">Your quests</h2>
            </div>
            <div
              aria-label="Filter My Quests by status"
              className="tabs tabs-box w-fit rounded-2xl border border-base-300 bg-base-100 p-1"
              role="group"
            >
              {tabs.map((tab) => (
                <button
                  aria-pressed={status === tab.value}
                  className={`tab rounded-xl font-bold ${
                    status === tab.value ? 'tab-active bg-primary text-primary-content' : ''
                  }`}
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {participations.isPending && (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="skeleton h-[30rem] rounded-[1.35rem]" key={index} />
              ))}
            </div>
          )}

          {participations.isError && (
            <div className="kiwi-panel mt-5 p-6" role="alert">
              <h3 className="text-xl">We could not load your Mission Board</h3>
              <p className="mt-2 text-sm text-base-content/62">
                Your quest data is safe. Try loading it again.
              </p>
              <button
                className="btn btn-primary btn-sm mt-4"
                onClick={() => participations.refetch()}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {participations.data?.length === 0 && (
            <div className="kiwi-panel mt-5 px-6 py-14 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                {status === 'cancelled'
                  ? <History aria-hidden="true" className="size-6" />
                  : <Target aria-hidden="true" className="size-6" />}
              </span>
              <h3 className="mt-5 text-2xl">
                {status === 'cancelled'
                  ? 'No cancelled quests'
                  : status === 'active'
                    ? 'No active quests yet'
                    : 'Your Mission Board is ready'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-base-content/60">
                Discover a quest that fits your interests, then join it to see it here.
              </p>
              <Link className="btn btn-primary mt-5 rounded-full" to="/quests">
                Discover quests <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          )}

          {participations.data && participations.data.length > 0 && (
            <>
              <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-base-300 bg-secondary/55 p-4 text-sm">
                <span className="inline-flex items-center gap-2 font-bold text-primary">
                  <Target aria-hidden="true" className="size-4" />
                  {participations.data.filter((item) => item.status === 'Active').length} active
                </span>
                <span className="inline-flex items-center gap-2 text-base-content/62">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  Completion is verified on each Quest page
                </span>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {participations.data.map((item) => (
                  <QuestCard
                    key={item.participationId}
                    quest={item.quest}
                    statusLabel={item.status === 'Active' ? 'Active mission' : 'Participation cancelled'}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="kiwi-panel mt-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-warning">
              <Zap aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-xl">Ready for another local action?</h2>
              <p className="mt-1 text-sm text-base-content/62">
                Browse the full quest catalogue and find your next mission.
              </p>
            </div>
          </div>
          <Link className="btn btn-outline rounded-full" to="/quests">
            <Compass aria-hidden="true" className="size-4" />
            Open Discover
          </Link>
        </section>
      </main>
    </div>
  );
}
