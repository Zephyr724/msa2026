import { APIProvider, Map } from '@vis.gl/react-google-maps';

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
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const position = latitude && longitude
    ? { lat: Number(latitude), lng: Number(longitude) }
    : AUCKLAND_CENTER;

  return (
    <div className="space-y-3">
      {apiKey && !disabled ? (
        <APIProvider apiKey={apiKey}>
          <div className="h-64 overflow-hidden rounded-2xl border border-base-300">
            <Map
              center={position}
              defaultZoom={12}
              gestureHandling="greedy"
              mapId="DEMO_MAP_ID"
              onClick={(event) => {
                const point = event.detail.latLng;
                if (point) {
                  onChange(
                    point.lat.toFixed(6),
                    point.lng.toFixed(6),
                  );
                }
              }}
              reuseMaps
            />
          </div>
          <p className="text-sm text-base-content/60">
            Click the map to choose a location, then fine-tune it with the
            keyboard-accessible fields below.
          </p>
        </APIProvider>
      ) : (
        <p className="rounded-2xl border border-dashed border-base-300 p-4 text-sm text-base-content/60">
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
