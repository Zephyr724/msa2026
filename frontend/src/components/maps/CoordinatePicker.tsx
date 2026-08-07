import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { googleMapsConfig } from '../../lib/googleMapsConfig';
import { PlaceSearch } from './PlaceSearch';

const AUCKLAND_CENTER = { lat: -36.8509, lng: 174.7645 };

interface CoordinatePickerProps {
  latitude: string;
  longitude: string;
  disabled?: boolean;
  onChange: (latitude: string, longitude: string) => void;
  onPlaceSelect?: (description: string) => void;
}

export function CoordinatePicker({
  latitude,
  longitude,
  disabled = false,
  onChange,
  onPlaceSelect,
}: CoordinatePickerProps) {
  const { apiKey, isConfigured, mapId } = googleMapsConfig;
  const [loadFailed, setLoadFailed] = useState(false);
  const selectedPosition = parsePosition(latitude, longitude);
  const position = selectedPosition ?? AUCKLAND_CENTER;

  // Manual coordinate entry is the advanced fallback: tucked behind a
  // disclosure while the map flow works, immediately visible when it does
  // not (unconfigured key, load failure, or read-only mode).
  const manualFields = (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="form-control">
        <span className="label-text mb-1 font-medium">Latitude</span>
        <input
          className="input input-bordered w-full"
          disabled={disabled}
          max="90"
          min="-90"
          onChange={(event) => onChange(event.target.value, longitude)}
          placeholder="-36.850900"
          step="0.000001"
          type="number"
          value={latitude}
        />
      </label>
      <label className="form-control">
        <span className="label-text mb-1 font-medium">Longitude</span>
        <input
          className="input input-bordered w-full"
          disabled={disabled}
          max="180"
          min="-180"
          onChange={(event) => onChange(latitude, event.target.value)}
          placeholder="174.764500"
          step="0.000001"
          type="number"
          value={longitude}
        />
      </label>
    </div>
  );

  return (
    <div className="space-y-3">
      {isConfigured && apiKey && mapId && !disabled && !loadFailed ? (
        <APIProvider
          apiKey={apiKey}
          language="en"
          onError={() => setLoadFailed(true)}
          region="NZ"
        >
          <PlaceSearch
            onPick={(place) => {
              onChange(place.latitude, place.longitude);
              onPlaceSelect?.(place.description);
            }}
          />
          <div className="h-64 overflow-hidden rounded-2xl border border-base-300">
            <Map
              center={position}
              defaultZoom={12}
              gestureHandling="greedy"
              mapId={mapId}
              onClick={(event) => {
                const point = event.detail.latLng;
                if (point) {
                  // Six decimal places are precise enough for a Quest venue
                  // while avoiding noisy floating-point strings in the form.
                  onChange(
                    point.lat.toFixed(6),
                    point.lng.toFixed(6),
                  );
                }
              }}
              reuseMaps
            >
              {selectedPosition && (
                <AdvancedMarker
                  position={selectedPosition}
                  title="Selected Quest location"
                />
              )}
            </Map>
          </div>
          <p className="text-sm text-muted-content">
            Search for a place or click the map, then confirm the marker shows
            the right spot.
          </p>
          <details className="rounded-2xl border border-base-300 p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Enter coordinates manually (advanced)
            </summary>
            <div className="mt-3">{manualFields}</div>
          </details>
        </APIProvider>
      ) : (
        // Manual fields are immediately available as the accessible and
        // configuration-independent path for choosing coordinates.
        <>
          <p className="rounded-2xl border border-dashed border-base-300 p-4 text-sm text-muted-content">
            {disabled
              ? 'Map selection is unavailable; the saved coordinates are shown below.'
              : 'Place search and map are unavailable. Enter the coordinates manually below.'}
          </p>
          {manualFields}
        </>
      )}
    </div>
  );
}

function parsePosition(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
