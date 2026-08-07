import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';

// The description feeds the Quest form's Location description field, which is
// validated at 500 characters.
const DESCRIPTION_MAX_LENGTH = 500;
const MIN_QUERY_LENGTH = 3;
const PREDICTION_DEBOUNCE_MS = 300;
// If the Places library has not loaded by then (for example when the Places
// API is not enabled on the API key), degrade to map and manual entry instead
// of waiting forever.
const LIBRARY_LOAD_TIMEOUT_MS = 10_000;
const LISTBOX_ID = 'place-search-listbox';

export interface PlacePick {
  description: string;
  latitude: string;
  longitude: string;
}

interface Suggestion {
  placeId: string;
  text: string;
}

interface PlaceSearchProps {
  onPick: (pick: PlacePick) => void;
}

/**
 * Text-first New Zealand place search for the coordinate picker. Selecting a
 * suggestion resolves its coordinates, recentres the map for visual
 * confirmation, and reports a human-readable description. The Google place ID
 * is used only for the details request and is never stored or submitted.
 */
export function PlaceSearch({ onPick }: PlaceSearchProps) {
  const map = useMap();
  const places = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [unavailable, setUnavailable] = useState(false);
  // A monotonic request id discards prediction responses that return after a
  // newer query has been issued.
  const requestRef = useRef(0);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (places || unavailable) return undefined;
    const timer = window.setTimeout(() => setUnavailable(true), LIBRARY_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [places, unavailable]);

  useEffect(() => {
    if (!places || unavailable) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return undefined;
    const requestId = ++requestRef.current;
    const timer = window.setTimeout(() => {
      sessionTokenRef.current ??= new places.AutocompleteSessionToken();
      new places.AutocompleteService().getPlacePredictions(
        {
          componentRestrictions: { country: 'nz' },
          input: trimmed,
          sessionToken: sessionTokenRef.current,
        },
        (predictions, status) => {
          if (requestId !== requestRef.current) return;
          if (status === places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.map((prediction) => ({
              placeId: prediction.place_id,
              text: prediction.description,
            })));
            setActiveIndex(-1);
            setIsOpen(true);
          } else if (status === places.PlacesServiceStatus.ZERO_RESULTS) {
            closeListbox();
          } else {
            // The Places API is disabled or the request was rejected; the map
            // and manual coordinate entry keep working.
            setUnavailable(true);
            closeListbox();
          }
        },
      );
    }, PREDICTION_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [places, query, unavailable]);

  function closeListbox() {
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  async function selectSuggestion(suggestion: Suggestion) {
    if (!places) return;
    try {
      const service = new places.PlacesService(map ?? document.createElement('div'));
      const place = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        service.getDetails(
          {
            fields: ['name', 'formatted_address', 'geometry.location'],
            placeId: suggestion.placeId,
            sessionToken: sessionTokenRef.current ?? undefined,
          },
          (result, status) => {
            if (status === places.PlacesServiceStatus.OK && result?.geometry?.location) {
              resolve(result);
            } else {
              reject(new Error(`Place details request failed with status ${status}.`));
            }
          },
        );
      });
      // The billing session ends with the details request, so the next search
      // starts a fresh token.
      sessionTokenRef.current = null;
      const location = place.geometry?.location;
      if (!location) {
        setUnavailable(true);
        closeListbox();
        return;
      }
      const lat = location.lat();
      const lng = location.lng();
      const description = buildDescription(place);
      setQuery(description);
      closeListbox();
      // Move the marker target into view so the organizer can visually
      // confirm the chosen place on the map.
      map?.panTo({ lat, lng });
      map?.setZoom(15);
      onPick({
        description,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      });
    } catch {
      setUnavailable(true);
      closeListbox();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (suggestions.length === 0) return;
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      // Selecting a suggestion must not submit the surrounding Quest form.
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      closeListbox();
    }
  }

  if (unavailable) {
    return (
      <p className="rounded-xl border border-dashed border-base-300 p-3 text-sm text-muted-content">
        Place search is unavailable. Click the map or enter coordinates below.
      </p>
    );
  }

  return (
    <div className="relative">
      <label className="form-control">
        <span className="label-text mb-1 font-medium">Search for a place</span>
        <input
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-autocomplete="list"
          aria-controls={LISTBOX_ID}
          aria-expanded={isOpen}
          autoComplete="off"
          className="input input-bordered w-full"
          disabled={!places}
          onBlur={closeListbox}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (value.trim().length < MIN_QUERY_LENGTH) closeListbox();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Start typing a New Zealand place or address"
          role="combobox"
          type="text"
          value={query}
        />
      </label>
      {isOpen && suggestions.length > 0 && (
        <ul
          className="menu absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-2 shadow-lg"
          id={LISTBOX_ID}
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              aria-selected={index === activeIndex}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${
                index === activeIndex ? 'bg-base-200' : ''
              }`}
              id={optionId(index)}
              key={suggestion.placeId}
              // preventDefault keeps input focus so blur does not close the
              // listbox before the selection is handled.
              onMouseDown={(event) => {
                event.preventDefault();
                void selectSuggestion(suggestion);
              }}
              role="option"
            >
              {suggestion.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function optionId(index: number) {
  return `place-search-option-${index}`;
}

function buildDescription(place: google.maps.places.PlaceResult): string {
  const name = place.name?.trim() ?? '';
  const address = place.formatted_address?.trim() ?? '';
  const combined = name && address && !address.includes(name)
    ? `${name}, ${address}`
    : address || name;
  return combined.slice(0, DESCRIPTION_MAX_LENGTH);
}
