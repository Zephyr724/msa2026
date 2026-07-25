import { useParams, Link } from 'react-router-dom';
import { useQuestDetail, useQuestImages } from '../hooks/useQuests';
import { ApiError } from '../lib/api/apiFetch';
import QuestCompletionPanel from '../components/quest/QuestCompletionPanel';
import QuestParticipationPanel from '../components/quest/QuestParticipationPanel';

export default function QuestDetailPage() {
  const { questId } = useParams<{ questId: string }>();
  const {
    data: quest,
    error,
    isLoading,
    isError,
    refetch,
  } = useQuestDetail(questId!);
  const { data: images } = useQuestImages(questId!);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="skeleton h-64 w-full mb-4 rounded-lg" />
        <div className="skeleton h-4 w-full mb-2" />
        <div className="skeleton h-4 w-3/4 mb-2" />
      </main>
    );
  }

  if (isError && error instanceof ApiError && error.status === 404) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Quest Not Found</h1>
        <p className="mb-4">The quest you're looking for doesn't exist or is no longer available.</p>
        <Link to="/quests" className="btn btn-primary">Back to Quests</Link>
      </main>
    );
  }

  if (isError || !quest) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Unable to Load Quest</h1>
        <p className="mb-4">
          Something went wrong while loading this quest. Please try again.
        </p>
        <div className="flex justify-center gap-3">
          <button className="btn btn-primary" onClick={() => refetch()}>Retry</button>
          <Link to="/quests" className="btn btn-ghost">Back to Quests</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/quests" className="btn btn-ghost btn-sm mb-4">&larr; Back to Quests</Link>

      {/* Cover Image */}
      {quest.coverImage && (
        <figure className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6 bg-base-200">
          <img
            src={quest.coverImage.imageUrl}
            alt={quest.coverImage.altText}
            className="w-full h-full object-cover"
          />
        </figure>
      )}

      {/* Title and badges */}
      <h1 className="text-3xl font-bold mb-4">{quest.title}</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="badge badge-lg">{quest.category}</span>
        <span className="badge badge-lg badge-outline">{quest.difficulty}</span>
        <span className="badge badge-lg">{quest.xpAward} XP</span>
        <span className="badge badge-lg badge-outline">{quest.sourceType}</span>
        {quest.registrationMode && (
          <span className="badge badge-lg">{quest.registrationMode}</span>
        )}
      </div>

      {/* Description */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="whitespace-pre-wrap">{quest.description}</p>
      </section>

      {/* Details grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {quest.startAtUtc && (
          <div>
            <span className="font-semibold">Starts:</span>{' '}
            {new Date(quest.startAtUtc).toLocaleString()}
          </div>
        )}
        {quest.endAtUtc && (
          <div>
            <span className="font-semibold">Ends:</span>{' '}
            {new Date(quest.endAtUtc).toLocaleString()}
          </div>
        )}
        {quest.capacity && (
          <div>
            <span className="font-semibold">Capacity:</span> {quest.capacity}
          </div>
        )}
        {quest.locationRegion && (
          <div>
            <span className="font-semibold">Region:</span> {quest.locationRegion.name}
          </div>
        )}
        {quest.locationDescription && (
          <div>
            <span className="font-semibold">Location:</span> {quest.locationDescription}
          </div>
        )}
      </section>

      <QuestParticipationPanel
        questId={quest.id}
        registrationMode={quest.registrationMode}
      />
      {/* Keyed so local reveal/input state can never leak across quests. */}
      <QuestCompletionPanel
        key={quest.id}
        questId={quest.id}
        registrationMode={quest.registrationMode}
      />

      {/* External Source */}
      {quest.externalSourceUrl && (
        <section className="mb-6 p-4 bg-base-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">External Source</h2>
          <p className="text-sm text-base-content/70 mb-2">
            Registration is managed by the original event provider.
            The official source is authoritative.
          </p>
          {quest.sourceCheckedAt && (
            <p className="text-xs mb-2">
              Last checked: {new Date(quest.sourceCheckedAt).toLocaleDateString()}
            </p>
          )}
          <a
            href={quest.externalSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            Visit Official Source
          </a>
        </section>
      )}

      {/* Additional Images */}
      {images && images.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <figure key={img.id} className="rounded-lg overflow-hidden bg-base-200">
                <img
                  src={img.imageUrl}
                  alt={img.altText}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                {img.creatorName && (
                  <figcaption className="p-2 text-xs">
                    {img.creatorName}
                    {img.licenceNote && ` — ${img.licenceNote}`}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
