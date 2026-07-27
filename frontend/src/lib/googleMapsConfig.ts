export interface GoogleMapsEnvironment {
  VITE_GOOGLE_MAPS_API_KEY?: string;
  VITE_GOOGLE_MAPS_MAP_ID?: string;
}

export interface GoogleMapsConfig {
  apiKey: string | null;
  mapId: string | null;
  isConfigured: boolean;
}

export function resolveGoogleMapsConfig(
  environment: GoogleMapsEnvironment,
): GoogleMapsConfig {
  const apiKey = normalize(environment.VITE_GOOGLE_MAPS_API_KEY);
  const mapId = normalize(environment.VITE_GOOGLE_MAPS_MAP_ID);

  return {
    apiKey,
    mapId,
    isConfigured: apiKey !== null && mapId !== null,
  };
}

export const googleMapsConfig = resolveGoogleMapsConfig({
  VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  VITE_GOOGLE_MAPS_MAP_ID: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
});

function normalize(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
