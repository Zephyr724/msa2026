import {
  ArrowRight,
  Award,
  Clock3,
  Compass,
  FileCheck2,
  History,
  RotateCcw,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PlayerStatusSummary from '../components/PlayerStatusSummary.tsx';
import QuestCard from '../components/quest/QuestCard.tsx';
import CategoryEmblem from '../components/quest/CategoryEmblem.tsx';
import { useMyClaims } from '../hooks/useCompletion.ts';
import {
  useAllPassportCompletions,
} from '../hooks/usePassportCompletions.ts';
import { useMyQuestParticipationsQuery } from '../hooks/useParticipation.ts';
import { CATEGORY_PRESENTATION } from '../lib/questPresentation.ts';
import type { EvidenceClaimSummary } from '../types/completion.ts';
import type {
  PassportCompletionItem,
} from '../types/passport.ts';
import type {
  MyQuestParticipationListItemDto,
} from '../types/participation.ts';

type MissionView = 'active' | 'ready' | 'review' | 'completed' | 'cancelled';

const primaryTabs: Array<{
  value: Exclude<MissionView, 'cancelled'>;
  label: string;
}> = [
  { value: 'active', label: 'Active' },
  { value: 'ready', label: 'Ready to Complete' },
  { value: 'review', label: 'Under Review' },
  { value: 'completed', label: 'Completed' },
];

function readView(value: string | null, legacy: string | null): MissionView {
  if (
    value === 'active'
    || value === 'ready'
    || value === 'review'
    || value === 'completed'
    || value === 'cancelled'
  ) return value;
  if (legacy === 'cancelled') return 'cancelled';
  return 'active';
}

export default function MyQuestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = readView(searchParams.get('view'), searchParams.get('status'));
  const participations = useMyQuestParticipationsQuery('all');
  const claims = useMyClaims();
  const passport = useAllPassportCompletions();

  function setView(next: MissionView) {
    setSearchParams(next === 'active' ? {} : { view: next });
  }

  const completionByQuest = new Map(
    passport.data?.map((item) => [item.questId, item]) ?? [],
  );
  const claimByQuest = new Map<string, EvidenceClaimSummary>();
  for (const claim of claims.data ?? []) {
    // The API returns newest first. First write wins so an older rejected
    // attempt can never overwrite a newer resubmitted Pending claim.
    if (!claimByQuest.has(claim.questId)) claimByQuest.set(claim.questId, claim);
  }
  const activeParticipations = participations.data?.filter(
    (item) => item.status === 'Active',
  ) ?? [];
  const cancelledParticipations = participations.data?.filter(
    (item) => item.status === 'Cancelled',
  ) ?? [];
  const active = activeParticipations.filter((item) => {
    const completion = completionByQuest.get(item.quest.id);
    const claim = claimByQuest.get(item.quest.id);
    if (completion?.status === 'Verified' || completion?.status === 'SelfReported') {
      return false;
    }
    if (claim?.status === 'Pending' || completion?.status === 'Pending') {
      return false;
    }
    return item.quest.startAtUtc === null
      || new Date(item.quest.startAtUtc).getTime() > Date.now();
  });
  const ready = activeParticipations.filter((item) => {
    const completion = completionByQuest.get(item.quest.id);
    const claim = claimByQuest.get(item.quest.id);
    if (completion?.status === 'Verified' || completion?.status === 'SelfReported') {
      return false;
    }
    if (claim?.status === 'Pending' || completion?.status === 'Pending') {
      return false;
    }
    return item.quest.startAtUtc !== null
      && new Date(item.quest.startAtUtc).getTime() <= Date.now();
  });
  const underReview = claims.data?.filter((claim) => claim.status === 'Pending') ?? [];
  const completed = passport.data?.filter(
    (item) => item.status === 'Verified' || item.status === 'SelfReported',
  ) ?? [];

  const currentCount = {
    active: active.length,
    ready: ready.length,
    review: underReview.length,
    completed: completed.length,
    cancelled: cancelledParticipations.length,
  }[view];

  const dataPending = participations.isPending || claims.isPending || passport.isPending;
  const dataError = participations.isError || claims.isError || passport.isError;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
      <main className="kiwi-page">
        <header>
          <p className="kiwi-stat-label">Your next steps</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Mission Board</h1>
          <p className="mt-3 max-w-2xl text-lg text-base-content/62">
            Move from joining to completing, review, and a lasting Passport record.
          </p>
        </header>

        <div className="mt-8">
          <PlayerStatusSummary />
        </div>

        <section className="mt-9" aria-labelledby="mission-list-title">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kiwi-stat-label">Quest path</p>
                <h2 className="mt-1 text-2xl" id="mission-list-title">Your quests</h2>
              </div>
              <button
                aria-pressed={view === 'cancelled'}
                className={`btn btn-sm ${view === 'cancelled' ? 'btn-active' : 'btn-ghost'}`}
                onClick={() => setView('cancelled')}
                type="button"
              >
                <History aria-hidden="true" className="size-4" />
                Cancelled ({cancelledParticipations.length})
              </button>
            </div>
            <div
              aria-label="Mission Board view"
              className="grid grid-cols-2 gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 md:grid-cols-4"
              role="group"
            >
              {primaryTabs.map((tab) => (
                <button
                  aria-pressed={view === tab.value}
                  className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                    view === tab.value
                      ? 'bg-primary text-primary-content'
                      : 'text-base-content/65 hover:bg-secondary'
                  }`}
                  key={tab.value}
                  onClick={() => setView(tab.value)}
                  type="button"
                >
                  {tab.label}
                  <span className="ml-1 opacity-70">
                    ({{
                      active: active.length,
                      ready: ready.length,
                      review: underReview.length,
                      completed: completed.length,
                    }[tab.value]})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {dataPending && (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="skeleton h-[28rem] rounded-[1.35rem]" key={index} />
              ))}
            </div>
          )}

          {dataError && (
            <div className="kiwi-panel mt-5 p-6" role="alert">
              <h3 className="text-xl">We could not classify your Mission Board</h3>
              <p className="mt-2 text-sm text-base-content/62">
                No state is guessed when a participation, claim, or Passport read fails.
              </p>
              <button
                className="btn btn-primary btn-sm mt-4"
                onClick={() => void Promise.all([
                  participations.refetch(),
                  claims.refetch(),
                  passport.refetch(),
                ])}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {!dataPending && !dataError && currentCount === 0 && (
            <MissionEmptyState view={view} />
          )}

          {!dataPending && !dataError && view === 'active' && active.length > 0 && (
            <QuestGrid
              items={active}
              status={(item) => item.quest.startAtUtc === null
                ? 'Active · schedule to be confirmed'
                : `Active · starts ${
                  new Date(item.quest.startAtUtc).toLocaleDateString()
                }`}
            />
          )}

          {!dataPending && !dataError && view === 'ready' && ready.length > 0 && (
            <>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm">
                <FileCheck2 aria-hidden="true" className="size-5 shrink-0 text-warning" />
                <p>
                  Open a Quest to enter a completion code, submit evidence, or
                  add a clearly labelled self-reported record.
                </p>
              </div>
              <QuestGrid
                items={ready}
                status={(item) => {
                  const rejected = claimByQuest.get(item.quest.id)?.status === 'Rejected'
                    || completionByQuest.get(item.quest.id)?.status === 'Rejected';
                  return rejected ? 'Claim not verified · try again' : 'Ready to complete';
                }}
              />
            </>
          )}

          {!dataPending && !dataError && view === 'review' && underReview.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {underReview.map((claim) => <ReviewCard claim={claim} key={claim.claimId} />)}
            </div>
          )}

          {!dataPending && !dataError && view === 'completed' && completed.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {completed.map((item) => <CompletedCard item={item} key={item.completionId} />)}
            </div>
          )}

          {!dataPending && !dataError && view === 'cancelled'
            && cancelledParticipations.length > 0 && (
            <QuestGrid
              items={cancelledParticipations}
              status={() => 'Participation cancelled'}
            />
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
                Browse the full Quest catalogue and find your next mission.
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

function QuestGrid({
  items,
  status,
}: {
  items: MyQuestParticipationListItemDto[];
  status: (item: MyQuestParticipationListItemDto) => string;
}) {
  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <QuestCard
          key={item.participationId}
          quest={item.quest}
          statusLabel={status(item)}
        />
      ))}
    </div>
  );
}

function ReviewCard({ claim }: { claim: EvidenceClaimSummary }) {
  return (
    <article className="kiwi-panel p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-info/12 text-info">
          <Clock3 aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="badge badge-warning">Under review</span>
          <h3 className="mt-3 text-xl">{claim.questTitle}</h3>
          <p className="mt-2 text-sm text-base-content/60">
            Submitted <time dateTime={claim.createdAtUtc}>
              {new Date(claim.createdAtUtc).toLocaleDateString()}
            </time>
          </p>
          <p className="mt-3 text-sm text-base-content/65">
            XP is awarded only if an Admin approves this evidence claim.
          </p>
          <Link className="btn btn-outline btn-sm mt-4" to={`/quests/${claim.questId}`}>
            View Quest <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CompletedCard({ item }: { item: PassportCompletionItem }) {
  const verified = item.status === 'Verified';
  return (
    <article className="kiwi-panel p-5">
      <div className="flex items-start gap-3">
        <CategoryEmblem category={item.questCategory} size="md" />
        <div className="min-w-0 flex-1">
          <p className="kiwi-stat-label">
            {CATEGORY_PRESENTATION[item.questCategory].label}
          </p>
          <h3 className="mt-1 text-xl">{item.questTitle}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`badge ${verified ? 'badge-success' : 'badge-info'}`}>
              {verified ? (
                <><ShieldCheck aria-hidden="true" className="size-3" /> Verified</>
              ) : 'Self-reported'}
            </span>
            <span className="text-xs text-base-content/55">
              {new Date(item.completedAtUtc).toLocaleDateString()}
            </span>
            <span className="text-xs font-bold">
              {verified
                ? item.xpAmount === null ? 'XP pending' : `${item.xpAmount} XP`
                : 'Passport only · no XP'}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="btn btn-outline btn-sm" to={`/quests/${item.questId}`}>
              View Quest
            </Link>
            {verified && (
              <Link className="btn btn-primary btn-sm" to="/passport/share">
                Create Share Card
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function MissionEmptyState({ view }: { view: MissionView }) {
  const state = {
    active: {
      Icon: Compass,
      title: 'No upcoming active missions',
      description: 'Join a future Quest and it will appear here.',
    },
    ready: {
      Icon: Target,
      title: 'Nothing ready to complete',
      description: 'Joined Quests move here when their start time arrives.',
    },
    review: {
      Icon: Clock3,
      title: 'No claims under review',
      description: 'Pending evidence claims appear here without guessed outcomes.',
    },
    completed: {
      Icon: Award,
      title: 'No completed Quests yet',
      description: 'Verified and self-reported Passport records appear here.',
    },
    cancelled: {
      Icon: RotateCcw,
      title: 'No cancelled Quests',
      description: 'Cancelled participation history remains available here.',
    },
  }[view];
  const Icon = state.Icon;

  return (
    <div className="kiwi-panel mt-5 px-6 py-14 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h3 className="mt-5 text-2xl">{state.title}</h3>
      <p className="mx-auto mt-2 max-w-md text-base-content/60">{state.description}</p>
      <Link className="btn btn-primary mt-5 rounded-full" to="/quests">
        Discover Quests <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
