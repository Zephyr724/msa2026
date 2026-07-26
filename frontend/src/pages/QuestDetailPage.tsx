import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import QuestCompletionPanel from '../components/quest/QuestCompletionPanel.tsx';
import QuestParticipationPanel from '../components/quest/QuestParticipationPanel.tsx';
import {
  CATEGORY_PRESENTATION,
  DIFFICULTY_LABELS,
  formatQuestDate,
  REGISTRATION_LABELS,
  SOURCE_LABELS,
} from '../lib/questPresentation.ts';
import CategoryEmblem from '../components/quest/CategoryEmblem.tsx';
import { useQuestDetail, useQuestImages } from '../hooks/useQuests.ts';
import { ApiError } from '../lib/api/apiFetch.ts';

const QUEST_IMAGE_FALLBACK = '/images/quests/quest-fallback.svg';

export default function QuestDetailPage() {
  const { questId } = useParams<{ questId: string }>();
  const questQuery = useQuestDetail(questId!);
  const images = useQuestImages(questId!);

  if (questQuery.isLoading) return <QuestDetailSkeleton />;

  if (questQuery.isError && questQuery.error instanceof ApiError
      && questQuery.error.status === 404) {
    return (
      <StatePage
        action={<Link className="btn btn-primary" to="/quests">Back to Discover</Link>}
        description="The quest you’re looking for does not exist or is no longer available."
        title="Quest Not Found"
      />
    );
  }

  if (questQuery.isError || !questQuery.data) {
    return (
      <StatePage
        action={(
          <div className="flex justify-center gap-3">
            <button className="btn btn-primary" onClick={() => questQuery.refetch()} type="button">
              Retry
            </button>
            <Link className="btn btn-ghost" to="/quests">Back to Discover</Link>
          </div>
        )}
        description="Something went wrong while loading this quest. Please try again."
        title="Unable to Load Quest"
      />
    );
  }

  const quest = questQuery.data;
  const category = CATEGORY_PRESENTATION[quest.category];
  const cover = quest.coverImage?.imageUrl ?? QUEST_IMAGE_FALLBACK;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200">
      <section className="relative h-[22rem] overflow-hidden bg-secondary sm:h-[29rem]">
        <img
          alt={quest.coverImage?.altText ?? `Fallback illustration for ${quest.title}`}
          className="h-full w-full object-cover"
          src={cover}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-base-200" />
        <div className="kiwi-page absolute inset-x-0 top-5">
          <Link
            className="btn btn-sm rounded-full border-white/60 bg-base-100/92 text-base-content shadow-md backdrop-blur hover:bg-base-100"
            to="/quests"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Discover
          </Link>
        </div>
        <div className="kiwi-page absolute inset-x-0 bottom-6">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/45 bg-base-100/92 p-3 pr-5 shadow-lg backdrop-blur">
            <CategoryEmblem category={quest.category} size="md" />
            <div>
              <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.11em] text-primary">
                {category.label}
              </p>
              <p className="text-sm font-semibold">
                {quest.locationRegion?.name ?? 'Location to be confirmed'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="kiwi-page grid gap-8 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-success badge-outline">Published quest</span>
            <span className="badge badge-outline">{SOURCE_LABELS[quest.sourceType]}</span>
          </div>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{quest.title}</h1>

          <section
            aria-label="Quest details"
            className="kiwi-panel mt-7 grid gap-5 p-5 sm:grid-cols-2 sm:p-6"
          >
            <Detail icon={CalendarDays} label="Date & time">
              {formatQuestDate(quest.startAtUtc)}
            </Detail>
            <Detail icon={MapPin} label="General location">
              {quest.locationDescription ?? quest.locationRegion?.name ?? 'To be confirmed'}
            </Detail>
            {quest.endAtUtc && (
              <Detail icon={Clock3} label="Ends">
                {new Date(quest.endAtUtc).toLocaleString()}
              </Detail>
            )}
            <Detail icon={Users} label="Capacity">
              {quest.capacity ? `Up to ${quest.capacity} participants` : 'No capacity published'}
            </Detail>
          </section>

          <section className="mt-7 rounded-3xl border border-accent/40 bg-accent/10 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl">
              <Sparkles aria-hidden="true" className="size-5 text-warning" />
              Rewards for completing
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/45 bg-base-100 px-3 py-2 text-sm font-extrabold">
                <Zap aria-hidden="true" className="size-4 text-warning" />
                {quest.xpAward} verified XP
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-2 text-sm font-semibold">
                <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                Progress saved to your Passport
              </span>
            </div>
          </section>

          <section className="kiwi-panel mt-7 p-5 sm:p-6">
            <h2 className="text-2xl">Quest briefing</h2>
            <ol className="mt-5 grid gap-4">
              {[
                ['Join this quest', 'Add it to your Mission Board.'],
                ['Take part', 'Follow the organizer’s details and attend the activity.'],
                ['Verify your completion', 'Enter the completion code shared by the organizer.'],
                ['Earn your reward', `Receive ${quest.xpAward} XP after verification.`],
              ].map(([title, description], index) => (
                <li className="grid grid-cols-[2rem_1fr] gap-3" key={title}>
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-content">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base">{title}</h3>
                    <p className="mt-0.5 text-sm text-base-content/62">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-9">
            <h2 className="text-2xl">About this quest</h2>
            <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-base-content/72">
              {quest.description}
            </p>
          </section>

          {quest.externalSourceUrl && (
            <section className="kiwi-panel mt-8 p-5 sm:p-6">
              <h2 className="text-xl">Official source</h2>
              <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                Registration is managed by the original event provider. Its
                published information remains authoritative.
              </p>
              {quest.sourceCheckedAt && (
                <p className="mt-3 text-xs font-semibold text-base-content/52">
                  Last checked {new Date(quest.sourceCheckedAt).toLocaleDateString()}
                </p>
              )}
              <a
                className="btn btn-outline btn-sm mt-4"
                href={quest.externalSourceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit official source
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            </section>
          )}

          {images.data && images.data.length > 0 && (
            <section className="mt-9">
              <h2 className="flex items-center gap-2 text-2xl">
                <ImageIcon aria-hidden="true" className="size-5 text-primary" />
                Gallery
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {images.data.map((image) => (
                  <figure className="overflow-hidden rounded-2xl border border-base-300 bg-base-100" key={image.id}>
                    <img
                      alt={image.altText}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                      src={image.imageUrl}
                    />
                    {image.creatorName && (
                      <figcaption className="p-3 text-xs text-base-content/60">
                        {image.creatorName}
                        {image.licenceNote && ` — ${image.licenceNote}`}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="kiwi-panel p-5">
            <h2 className="text-xl">Quest snapshot</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <Snapshot label="XP reward" value={`${quest.xpAward} XP`} />
              <Snapshot label="Difficulty" value={DIFFICULTY_LABELS[quest.difficulty]} />
              <Snapshot
                label="Completion"
                value={quest.registrationMode === 'Native' ? 'Completion code' : 'See quest source'}
              />
              <Snapshot
                label="Registration"
                value={quest.registrationMode
                  ? REGISTRATION_LABELS[quest.registrationMode]
                  : 'Not specified'}
              />
            </dl>
          </section>
          <QuestParticipationPanel
            questId={quest.id}
            registrationMode={quest.registrationMode}
          />
          <QuestCompletionPanel
            key={quest.id}
            questId={quest.id}
            questTitle={quest.title}
            registrationMode={quest.registrationMode}
            xpAward={quest.xpAward}
          />
        </aside>
      </main>
    </div>
  );
}

function Detail({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <dt className="kiwi-stat-label">{label}</dt>
        <dd className="mt-1 text-sm font-semibold leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-base-300 pb-3 last:border-0 last:pb-0">
      <dt className="text-base-content/55">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}

function QuestDetailSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-base-200" aria-live="polite">
      <div className="skeleton h-[22rem] w-full rounded-none sm:h-[29rem]" />
      <div className="kiwi-page grid gap-8 py-8 lg:grid-cols-[1fr_19rem]">
        <div>
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton mt-6 h-56 w-full rounded-3xl" />
        </div>
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </main>
  );
}

function StatePage({
  action,
  description,
  title,
}: {
  action: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-base-200 px-4 py-16 text-center">
      <div className="kiwi-panel max-w-lg p-8 sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
          <CheckCircle2 aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-5 text-3xl">{title}</h1>
        <p className="mt-3 text-base-content/62">{description}</p>
        <div className="mt-6">{action}</div>
      </div>
    </main>
  );
}
