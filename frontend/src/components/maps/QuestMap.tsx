import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { googleMapsConfig } from '../../lib/googleMapsConfig';
import type { QuestListItemDto } from '../../types/quest';

const AUCKLAND_CENTER = { lat: -36.8509, lng: 174.7645 };

export function QuestMap({ quests }: { quests: QuestListItemDto[] }) {
  const { apiKey, isConfigured, mapId } = googleMapsConfig;
  const mapped = useMemo(
    () => quests.filter(
      (quest) => typeof quest.latitude === 'number'
        && typeof quest.longitude === 'number',
    ),
    [quests],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const selected = mapped.find((quest) => quest.id === selectedId);

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
          <FitMappedQuests quests={mapped} />
          {mapped.map((quest) => (
            <AdvancedMarker
              key={quest.id}
              onClick={() => setSelectedId(quest.id)}
              position={{ lat: quest.latitude!, lng: quest.longitude! }}
              title={quest.title}
            />
          ))}
          {selected && (
            <InfoWindow
              onCloseClick={() => setSelectedId(null)}
              position={{ lat: selected.latitude!, lng: selected.longitude! }}
            >
              <div className="max-w-56 text-slate-900">
                <p className="font-bold">{selected.title}</p>
                <p className="mt-1 text-sm">
                  {selected.locationDescription ?? selected.locationRegion?.name}
                </p>
                <Link className="mt-2 inline-block font-semibold text-emerald-700" to={`/quests/${selected.id}`}>
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

function FitMappedQuests({ quests }: { quests: QuestListItemDto[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || quests.length === 0) return;
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
  }, [map, quests]);
  return null;
}
