import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { googleMapsConfig } from '../../lib/googleMapsConfig';
import type { QuestListItemDto } from '../../types/quest';

const AUCKLAND_CENTER = { lat: -36.8509, lng: 174.7645 };

export function QuestMap({
  onSelectQuest,
  quests,
  selectedQuestId,
}: {
  onSelectQuest?: (questId: string | null) => void;
  quests: QuestListItemDto[];
  selectedQuestId?: string | null;
}) {
  const { apiKey, isConfigured, mapId } = googleMapsConfig;
  const mapped = useMemo(
    () => quests.filter(
      (quest) => typeof quest.latitude === 'number'
        && typeof quest.longitude === 'number',
    ),
    [quests],
  );
  const [internalSelectedQuestId, setInternalSelectedQuestId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const isControlled = selectedQuestId !== undefined;
  const activeSelectedQuestId = isControlled
    ? selectedQuestId
    : internalSelectedQuestId;
  const selected = mapped.find((quest) => quest.id === activeSelectedQuestId);

  function selectQuest(questId: string | null) {
    if (!isControlled) setInternalSelectedQuestId(questId);
    onSelectQuest?.(questId);
  }

  if (!isConfigured || !apiKey || !mapId || loadFailed) {
    return (
      <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
        <div>
          <p className="font-bold">Quest map is temporarily unavailable</p>
          <p className="mt-2 max-w-md text-sm text-base-content/60">
            Use the complete Quest list below to discover and open every Quest.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      language="en"
      onError={() => setLoadFailed(true)}
      region="NZ"
    >
      <div className="h-[24rem] overflow-hidden rounded-3xl border border-base-300">
        <Map
          defaultCenter={AUCKLAND_CENTER}
          defaultZoom={10}
          gestureHandling="greedy"
          mapId={mapId}
          reuseMaps
        >
          <FitMappedQuests quests={mapped} selectedQuestId={activeSelectedQuestId} />
          {mapped.map((quest) => (
            <AdvancedMarker
              key={quest.id}
              onClick={() => selectQuest(quest.id)}
              position={{ lat: quest.latitude!, lng: quest.longitude! }}
              title={quest.title}
              zIndex={quest.id === activeSelectedQuestId ? 2 : 1}
            >
              <span
                aria-hidden="true"
                className={`grid size-10 place-items-center rounded-full border-2 border-white text-white shadow-lg transition-transform ${
                  quest.id === activeSelectedQuestId
                    ? 'scale-110 bg-emerald-800'
                    : 'bg-emerald-600'
                }`}
              >
                <MapPin className="size-5" strokeWidth={2.5} />
              </span>
            </AdvancedMarker>
          ))}
          {selected && (
            <InfoWindow
              onCloseClick={() => selectQuest(null)}
              position={{ lat: selected.latitude!, lng: selected.longitude! }}
            >
              <div className="w-72 overflow-hidden pr-3 text-slate-900 sm:w-80">
                <img
                  alt={selected.coverImage?.altText ?? ''}
                  className="h-20 w-full rounded-xl bg-slate-100 object-cover"
                  height="80"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = '/images/quests/quest-fallback.svg';
                  }}
                  src={selected.coverImage?.imageUrl ?? '/images/quests/quest-fallback.svg'}
                  width="320"
                />
                <p className="mt-2.5 pr-2 text-base font-bold leading-snug">{selected.title}</p>
                <p className="mt-1 line-clamp-2 pr-2 text-sm leading-relaxed text-slate-600">
                  {selected.locationDescription
                    ?? selected.locationRegion?.name
                    ?? 'Location to be confirmed'}
                </p>
                <Link
                  className="mt-2 inline-flex rounded-full bg-emerald-700 px-4 py-1.5 text-sm font-bold text-white"
                  to={`/quests/${selected.id}`}
                >
                  View Quest
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
      <p className="mt-2 text-sm text-base-content/55">
        {mapped.length} of {quests.length} visible Quests include map coordinates.
      </p>
    </APIProvider>
  );
}

function FitMappedQuests({
  quests,
  selectedQuestId,
}: {
  quests: QuestListItemDto[];
  selectedQuestId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || quests.length === 0) return;
    const selected = quests.find((quest) => quest.id === selectedQuestId);
    if (selected) {
      map.panTo({ lat: selected.latitude!, lng: selected.longitude! });
      if ((map.getZoom() ?? 0) < 12) map.setZoom(12);
      return;
    }
    if (quests.length === 1) {
      map.setCenter({ lat: quests[0].latitude!, lng: quests[0].longitude! });
      map.setZoom(13);
      return;
    }
    const latitudes = quests.map((quest) => quest.latitude!);
    const longitudes = quests.map((quest) => quest.longitude!);
    map.fitBounds({
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
    }, 48);
  }, [map, quests, selectedQuestId]);
  return null;
}
