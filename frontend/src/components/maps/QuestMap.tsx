import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { QuestListItemDto } from '../../types/quest';

const AUCKLAND_CENTER = { lat: -36.8509, lng: 174.7645 };

export function QuestMap({ quests }: { quests: QuestListItemDto[] }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapped = quests.filter(
    (quest) => quest.latitude !== null && quest.longitude !== null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = mapped.find((quest) => quest.id === selectedId);

  if (!apiKey) {
    return (
      <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
        <div>
          <p className="font-bold">Map preview is unavailable</p>
          <p className="mt-2 max-w-md text-sm text-base-content/60">
            The complete Quest list remains available below. Add a restricted
            VITE_GOOGLE_MAPS_API_KEY locally to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[24rem] overflow-hidden rounded-3xl border border-base-300">
        <Map
          defaultCenter={AUCKLAND_CENTER}
          defaultZoom={10}
          gestureHandling="greedy"
          mapId="DEMO_MAP_ID"
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
