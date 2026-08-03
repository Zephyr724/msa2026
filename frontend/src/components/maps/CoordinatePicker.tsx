import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { googleMapsConfig } from '../../lib/googleMapsConfig';

const AUCKLAND_CENTER = { lat: -36.8509, lng: 174.7645 };

interface CoordinatePickerProps {
  latitude: string;
  longitude: string;
  disabled?: boolean;
  onChange: (latitude: string, longitude: string) => void;
}

export function CoordinatePicker({
  latitude,
  longitude,
  disabled = false,
  onChange,
}: CoordinatePickerProps) {
  const { apiKey, isConfigured, mapId } = googleMapsConfig;
  const [loadFailed, setLoadFailed] = useState(false);
  const selectedPosition = parsePosition(latitude, longitude);
  const position = selectedPosition ?? AUCKLAND_CENTER;

  return (
    <div className="space-y-3">
      {isConfigured && apiKey && mapId && !disabled && !loadFailed ? (
        <APIProvider
          apiKey={apiKey}
          language="en"
          onError={() => setLoadFailed(true)}
          region="NZ"
        >
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
            Click the map to choose a location, then fine-tune it with the
            keyboard-accessible fields below.
          </p>
        </APIProvider>
      ) : (
        // Manual fields are always available as the accessible and
        // configuration-independent path for choosing coordinates.
        <p className="rounded-2xl border border-dashed border-base-300 p-4 text-sm text-muted-content">
          Map selection is unavailable, but coordinates can still be entered below.
        </p>
      )}
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
