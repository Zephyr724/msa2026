import { describe, expect, it } from 'vitest';
import { resolveGoogleMapsConfig } from '../../src/lib/googleMapsConfig';

describe('Google Maps configuration', () => {
  it('requires both the browser API key and map ID', () => {
    expect(resolveGoogleMapsConfig({})).toEqual({
      apiKey: null,
      mapId: null,
      isConfigured: false,
    });
    expect(resolveGoogleMapsConfig({
      VITE_GOOGLE_MAPS_API_KEY: 'browser-key',
    }).isConfigured).toBe(false);
    expect(resolveGoogleMapsConfig({
      VITE_GOOGLE_MAPS_MAP_ID: 'map-id',
    }).isConfigured).toBe(false);
  });

  it('trims configured values and enables maps', () => {
    expect(resolveGoogleMapsConfig({
      VITE_GOOGLE_MAPS_API_KEY: ' browser-key ',
      VITE_GOOGLE_MAPS_MAP_ID: ' map-id ',
    })).toEqual({
      apiKey: 'browser-key',
      mapId: 'map-id',
      isConfigured: true,
    });
  });

  it('treats whitespace-only values as absent', () => {
    expect(resolveGoogleMapsConfig({
      VITE_GOOGLE_MAPS_API_KEY: ' ',
      VITE_GOOGLE_MAPS_MAP_ID: '\n',
    }).isConfigured).toBe(false);
  });
});
