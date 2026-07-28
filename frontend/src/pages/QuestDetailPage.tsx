import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuestCompletionMethods from '../components/quest/QuestCompletionMethods.tsx';
import QuestParticipationPanel from '../components/quest/QuestParticipationPanel.tsx';
import {
  CATEGORY_PRESENTATION,
  DIFFICULTY_LABELS,
  formatQuestDate,
  REGISTRATION_LABELS,
  SOURCE_LABELS,
  questLocationTrail,
} from '../lib/questPresentation.ts';
import CategoryEmblem from '../components/quest/CategoryEmblem.tsx';
import { QuestMap } from '../components/maps/QuestMap.tsx';
import { useQuestDetail, useQuestImages, useQuestList } from '../hooks/useQuests.ts';
import { ApiError } from '../lib/api/apiFetch.ts';
import QuestCard, { RepositoryQuestScene } from '../components/quest/QuestCard.tsx';

const QUEST_IMAGE_FALLBACK = '/images/quests/quest-fallback.svg';

function isRepositoryQuestPlaceholder(imageUrl: string | null | undefined) {
  return Boolean(
    imageUrl?.startsWith('/images/quests/')
      && imageUrl.endsWith('.svg')
      && imageUrl !== QUEST_IMAGE_FALLBACK,
  );
}

export default function QuestDetailPage() {
  const { questId } = useParams<{ questId: string }>();
  const questQuery = useQuestDetail(questId!);
  const images = useQuestImages(questId!);
  const related = useQuestList(
    {
      category: questQuery.data?.category,
      page: 1,
      pageSize: 4,
    },
    Boolean(questQuery.data),
  );
  const [galleryIndex, setGalleryIndex] = useState(0);

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
  const coverIsRepositoryPlaceholder = isRepositoryQuestPlaceholder(cover);
  const galleryItems = images.data?.length
    ? images.data
    : [{
        id: 'repository-placeholder',
        imageUrl: cover,
        altText: quest.coverImage?.altText ?? `Illustration for ${quest.title}`,
        sortOrder: 0,
        isCover: true,
        creatorName: null,
        sourceUrl: null,
        licenceNote: null,
      }];
  const selectedGalleryImage = galleryItems[galleryIndex] ?? galleryItems[0]!;
  const locationTrail = questLocationTrail(quest.locationRegion);
  const supportsCompletionCode = quest.sourceType === 'OrganizerOwned'
    && quest.registrationMode === 'Native';
  const completionBriefing = supportsCompletionCode
    ? 'Use the organizer’s completion code, or keep a clearly labelled self-report.'
    : quest.sourceType === 'OrganizerOwned'
      ? 'Keep a clearly labelled self-report after taking part; it earns no XP.'
      : 'Submit private evidence for Admin review, or keep a clearly labelled self-report.';
  const completionSummary = [
    ...(supportsCompletionCode ? ['Code'] : []),
    ...(quest.sourceType !== 'OrganizerOwned' ? ['Evidence'] : []),
    'Self-report',
  ].join(' · ');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200">
      <section className="relative h-64 overflow-hidden bg-secondary md:h-[26.25rem]">
        {coverIsRepositoryPlaceholder ? (
          <RepositoryQuestScene category={quest.category} title={quest.title} />
        ) : (
          <img
            alt={quest.coverImage?.altText ?? `Fallback illustration for ${quest.title}`}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = QUEST_IMAGE_FALLBACK;
            }}
            src={cover}
          />
        )}
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
                {quest.locationDescription ?? quest.locationRegion?.name ?? 'Location to be confirmed'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="kiwi-page grid gap-8 pb-12 pt-8 lg:grid-cols-[minmax(0,1fr)_21.25rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-success badge-outline">Published quest</span>
            <span className="badge badge-outline">{SOURCE_LABELS[quest.sourceType]}</span>
          </div>
          <h1 className="mt-3 text-3xl leading-tight md:text-4xl">{quest.title}</h1>

          <section
            aria-label="Quest details"
            className="kiwi-panel mt-6 grid gap-4 p-5 sm:grid-cols-2"
          >
            <Detail icon={CalendarDays} label="Date & time">
              {formatQuestDate(quest.startAtUtc)}
            </Detail>
            <Detail icon={MapPin} label="Quest location">
              {quest.locationDescription ?? quest.locationRegion?.name ?? 'To be confirmed'}
            </Detail>
            {quest.endAtUtc && (
              <Detail icon={Clock3} label="Ends">
                {new Date(quest.endAtUtc).toLocaleString()}
              </Detail>
            )}
            <Detail icon={Users} label="Capacity">
              {quest.capacity === null
                ? 'No capacity published'
                : quest.availableSpots === undefined || quest.availableSpots === null
                  ? `Up to ${quest.capacity} participants`
                  : `${quest.availableSpots} of ${quest.capacity} places available`}
            </Detail>
            {locationTrail.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="kiwi-stat-label">Community · region · country</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {locationTrail.map((part) => (
                    <span className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary" key={part}>
                      {part}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </section>

          <section className="mt-5 rounded-[1.25rem] border border-accent/40 bg-accent/10 p-5">
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

          <section className="kiwi-panel mt-5 p-5">
            <h2 className="text-xl">Quest briefing</h2>
            <ol className="mt-4 grid gap-3">
              {[
                ['Join this quest', 'Add it to your Mission Board.'],
                ['Take part', 'Follow the organizer’s details and attend the activity.'],
                ['Record your completion', completionBriefing],
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

          <section className="mt-7">
            <h2 className="text-2xl">About this quest</h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-base-content/72">
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

          <section className="mt-9">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="kiwi-stat-label">See the experience</p>
                  <h2 className="mt-1 flex items-center gap-2 text-2xl">
                    <ImageIcon aria-hidden="true" className="size-5 text-primary" />
                    Quest gallery
                  </h2>
                </div>
                {galleryItems.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      aria-label="Previous image"
                      className="btn btn-outline btn-sm btn-square rounded-full"
                      onClick={() => setGalleryIndex((galleryIndex - 1 + galleryItems.length) % galleryItems.length)}
                      type="button"
                    >
                      <ChevronLeft aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      aria-label="Next image"
                      className="btn btn-outline btn-sm btn-square rounded-full"
                      onClick={() => setGalleryIndex((galleryIndex + 1) % galleryItems.length)}
                      type="button"
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                )}
              </div>
              <figure className="mt-4 overflow-hidden rounded-3xl border border-base-300 bg-base-100">
                {isRepositoryQuestPlaceholder(selectedGalleryImage?.imageUrl) ? (
                  <div className="h-[18rem] sm:h-[27rem]">
                    <RepositoryQuestScene category={quest.category} title={quest.title} />
                  </div>
                ) : (
                  <img
                    alt={selectedGalleryImage?.altText}
                    className="h-[18rem] w-full object-cover sm:h-[27rem]"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = QUEST_IMAGE_FALLBACK;
                    }}
                    src={selectedGalleryImage?.imageUrl}
                  />
                )}
                {(selectedGalleryImage?.creatorName || selectedGalleryImage?.licenceNote) && (
                  <figcaption className="px-5 py-3 text-xs text-base-content/60">
                    {selectedGalleryImage?.creatorName}
                    {selectedGalleryImage?.licenceNote
                      && ` — ${selectedGalleryImage.licenceNote}`}
                  </figcaption>
                )}
              </figure>
              {galleryItems.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {galleryItems.map((image, index) => (
                    <button
                      aria-label={`View gallery image ${index + 1}`}
                      aria-pressed={galleryIndex === index}
                      className={`shrink-0 overflow-hidden rounded-xl border-2 ${
                        galleryIndex === index ? 'border-primary' : 'border-transparent'
                      }`}
                      key={image.id}
                      onClick={() => setGalleryIndex(index)}
                      type="button"
                    >
                      {isRepositoryQuestPlaceholder(image.imageUrl) ? (
                        <div className="h-16 w-24" aria-hidden="true">
                          <RepositoryQuestScene category={quest.category} title={quest.title} />
                        </div>
                      ) : (
                        <img
                          alt=""
                          aria-hidden="true"
                          className="h-16 w-24 object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = QUEST_IMAGE_FALLBACK;
                          }}
                          src={image.imageUrl}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
          </section>

          {typeof quest.latitude === 'number' && typeof quest.longitude === 'number' && (
            <section className="mt-9" aria-labelledby="quest-location-heading">
              <p className="kiwi-stat-label">Plan your visit</p>
              <h2 className="mt-1 text-2xl" id="quest-location-heading">Quest location</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-base-content/68">
                {quest.locationDescription ?? quest.locationRegion?.name ?? 'Location to be confirmed'}
              </p>
              <div className="mt-4">
                <QuestMap quests={[quest]} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24" id="quest-actions">
          <section className="kiwi-panel p-5">
            <h2 className="text-xl">Quest snapshot</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <Snapshot label="XP reward" value={`${quest.xpAward} XP`} />
              <Snapshot label="Difficulty" value={DIFFICULTY_LABELS[quest.difficulty]} />
              <Snapshot
                label="Completion"
                value={completionSummary}
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
          <QuestCompletionMethods
            questId={quest.id}
            questTitle={quest.title}
            registrationMode={quest.registrationMode}
            sourceType={quest.sourceType}
            xpAward={quest.xpAward}
          />
        </aside>
      </main>

      {related.data && related.data.items.filter((item) => item.id !== quest.id).length > 0 && (
        <section className="border-t border-base-300 bg-secondary/45 py-12">
          <div className="kiwi-page">
            <p className="kiwi-stat-label">Keep exploring</p>
            <div className="flex items-end justify-between gap-4">
              <h2 className="mt-1 text-3xl">More quests you may like</h2>
              <Link className="btn btn-ghost btn-sm hidden sm:inline-flex" to="/quests">View all</Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {related.data.items
                .filter((item) => item.id !== quest.id)
                .slice(0, 3)
                .map((item) => <QuestCard key={item.id} quest={item} />)}
            </div>
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-[4.35rem] z-30 border-t border-base-300 bg-base-100/95 p-3 shadow-xl backdrop-blur md:hidden">
        <a className="btn btn-primary w-full rounded-full" href="#quest-actions">
          View quest actions <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </div>
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
