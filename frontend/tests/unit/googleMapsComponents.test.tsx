import { useState, type ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoordinatePicker } from '../../src/components/maps/CoordinatePicker';
import { QuestMap } from '../../src/components/maps/QuestMap';
import type { QuestListItemDto } from '../../src/types/quest';

const setCenter = vi.fn();
const setZoom = vi.fn();
const panTo = vi.fn();

// Mutable mock state so individual tests can flip the maps configuration or
// replace the Places library with failing/null variants.
const mockState = vi.hoisted(() => ({
  config: {
    apiKey: 'restricted-browser-key' as string | null,
    mapId: 'production-map-id' as string | null,
    isConfigured: true,
  },
  placesLibrary: { current: null as unknown },
  getDetails: vi.fn(),
  getPlacePredictions: vi.fn(),
}));
const mappedQuest: QuestListItemDto = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  title: 'Mapped Quest',
  description: 'A mapped quest.',
  category: 'RestoreNature',
  sourceType: 'OrganizerOwned',
  registrationMode: 'Native',
  difficulty: 'Easy',
  xpAward: 50,
  capacity: null,
  startAtUtc: null,
  endAtUtc: null,
  locationRegion: null,
  locationDescription: 'Auckland waterfront',
  latitude: -36.85,
  longitude: 174.76,
  coverImage: null,
};

vi.mock('../../src/lib/googleMapsConfig', () => ({
  googleMapsConfig: mockState.config,
}));

vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({
    apiKey,
    children,
  }: {
    apiKey: string;
    children: ReactNode;
  }) => <div data-api-key={apiKey}>{children}</div>,
  Map: ({
    children,
    mapId,
    onClick,
  }: {
    children?: ReactNode;
    mapId: string;
    onClick?: (event: { detail: { latLng: { lat: number; lng: number } } }) => void;
  }) => (
    <div data-map-id={mapId}>
      {children}
      {onClick && (
        <button
          onClick={() => onClick({
            detail: { latLng: { lat: -36.85, lng: 174.76 } },
          })}
          type="button"
        >
          Mock map click
        </button>
      )}
    </div>
  ),
  AdvancedMarker: ({
    children,
    onClick,
    title,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    title: string;
  }) => <button onClick={onClick} type="button">{title}{children}</button>,
  InfoWindow: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
  useMap: () => ({
    fitBounds: vi.fn(),
    getZoom: () => 10,
    panTo,
    setCenter,
    setZoom,
  }),
  useMapsLibrary: () => mockState.placesLibrary.current,
}));

function fakePlacesLibrary() {
  return {
    AutocompleteService: function AutocompleteService() {
      return { getPlacePredictions: mockState.getPlacePredictions };
    },
    PlacesService: function PlacesService() {
      return { getDetails: mockState.getDetails };
    },
    AutocompleteSessionToken: function AutocompleteSessionToken() {
      return {};
    },
    PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
  };
}

beforeEach(() => {
  mockState.config.apiKey = 'restricted-browser-key';
  mockState.config.mapId = 'production-map-id';
  mockState.config.isConfigured = true;
  mockState.placesLibrary.current = fakePlacesLibrary();
  mockState.getPlacePredictions.mockReset();
  mockState.getDetails.mockReset();
  mockState.getPlacePredictions.mockImplementation(
    (request: unknown, callback: (predictions: unknown, status: string) => void) => callback([
      { place_id: 'place-eden-summit', description: 'Mt Eden Summit, Auckland' },
      { place_id: 'place-eden-village', description: 'Mt Eden Village, Auckland' },
    ], 'OK'),
  );
  mockState.getDetails.mockImplementation(
    (request: unknown, callback: (place: unknown, status: string) => void) => callback({
      name: 'Mt Eden Summit',
      formatted_address: 'Auckland, New Zealand',
      geometry: { location: { lat: () => -36.8778, lng: () => 174.7642 } },
    }, 'OK'),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('configured Google Maps components', () => {
  it('uses the configured map ID and opens the selected Quest summary', () => {
    function Harness() {
      const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
      return (
        <MemoryRouter>
          <QuestMap
            onSelectQuest={setSelectedQuestId}
            quests={[mappedQuest]}
            selectedQuestId={selectedQuestId}
          />
        </MemoryRouter>
      );
    }

    const { container } = render(<Harness />);

    expect(container.querySelector('[data-api-key="restricted-browser-key"]')).toBeInTheDocument();
    expect(container.querySelector('[data-map-id="production-map-id"]')).toBeInTheDocument();
    expect(setCenter).toHaveBeenCalledWith({ lat: -36.85, lng: 174.76 });
    expect(setZoom).toHaveBeenCalledWith(13);

    fireEvent.click(screen.getByRole('button', { name: mappedQuest.title }));
    expect(panTo).toHaveBeenCalledWith({ lat: -36.85, lng: 174.76 });
    expect(screen.getByRole('link', { name: 'View Quest' })).toHaveAttribute(
      'href',
      `/quests/${mappedQuest.id}`,
    );
  });

  it('keeps marker selection working for the uncontrolled Quest Detail usage', () => {
    render(
      <MemoryRouter>
        <QuestMap quests={[mappedQuest]} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: mappedQuest.title }));

    expect(screen.getByRole('link', { name: 'View Quest' })).toHaveAttribute(
      'href',
      `/quests/${mappedQuest.id}`,
    );
  });

  it('shows and updates the coordinate-picker marker', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CoordinatePicker
        latitude="-36.900000"
        longitude="174.800000"
        onChange={onChange}
      />,
    );

    expect(container.querySelector('[data-map-id="production-map-id"]')).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'Selected Quest location',
    })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mock map click' }));
    expect(onChange).toHaveBeenCalledWith('-36.850000', '174.760000');
  });
});

describe('CoordinatePicker place search', () => {
  it('requests New Zealand predictions and renders suggestions while typing', async () => {
    render(<CoordinatePicker latitude="" longitude="" onChange={vi.fn()} />);

    const search = screen.getByRole('combobox', { name: 'Search for a place' });
    fireEvent.change(search, { target: { value: 'mt eden' } });

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Mt Eden Summit, Auckland',
      'Mt Eden Village, Auckland',
    ]);
    expect(search).toHaveAttribute('aria-expanded', 'true');
    expect(mockState.getPlacePredictions).toHaveBeenCalledWith(
      expect.objectContaining({
        componentRestrictions: { country: 'nz' },
        input: 'mt eden',
      }),
      expect.any(Function),
    );
  });

  it('selects a suggestion with the keyboard, recentres the map, and reports the place', async () => {
    const onChange = vi.fn();
    const onPlaceSelect = vi.fn();
    render(
      <CoordinatePicker
        latitude=""
        longitude=""
        onChange={onChange}
        onPlaceSelect={onPlaceSelect}
      />,
    );

    const search = screen.getByRole('combobox', { name: 'Search for a place' });
    fireEvent.change(search, { target: { value: 'mt eden' } });
    await screen.findAllByRole('option');
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('-36.877800', '174.764200'));
    expect(onPlaceSelect).toHaveBeenCalledWith('Mt Eden Summit, Auckland, New Zealand');
    expect(mockState.getDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: ['name', 'formatted_address', 'geometry.location'],
        placeId: 'place-eden-summit',
      }),
      expect.any(Function),
    );
    expect(panTo).toHaveBeenCalledWith({ lat: -36.8778, lng: 174.7642 });
    expect(setZoom).toHaveBeenCalledWith(15);
    expect(search).toHaveValue('Mt Eden Summit, Auckland, New Zealand');

    // Manual fine-tuning after a place selection still flows through onChange.
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-36.8779' } });
    expect(onChange).toHaveBeenLastCalledWith('-36.8779', '');
  });

  it('selects a suggestion with the mouse', async () => {
    const onChange = vi.fn();
    const onPlaceSelect = vi.fn();
    render(
      <CoordinatePicker
        latitude=""
        longitude=""
        onChange={onChange}
        onPlaceSelect={onPlaceSelect}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Search for a place' }), {
      target: { value: 'mt eden' },
    });
    const options = await screen.findAllByRole('option');
    fireEvent.mouseDown(options[1]);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('-36.877800', '174.764200'));
    expect(onPlaceSelect).toHaveBeenCalledWith('Mt Eden Summit, Auckland, New Zealand');
  });

  it('hides place search and keeps manual entry when maps are not configured', () => {
    mockState.config.apiKey = null;
    mockState.config.mapId = null;
    mockState.config.isConfigured = false;
    const onChange = vi.fn();
    render(<CoordinatePicker latitude="" longitude="" onChange={onChange} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText(/Place search and map are unavailable/)).toBeInTheDocument();

    // Manual entry is immediately visible — no disclosure to open first.
    expect(screen.queryByText('Enter coordinates manually (advanced)'))
      .not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-36.85' } });
    expect(onChange).toHaveBeenCalledWith('-36.85', '');
  });

  it('tucks raw coordinates behind an advanced disclosure when the map works', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CoordinatePicker latitude="" longitude="" onChange={onChange} />,
    );

    // Text-first: the place search and confirmation map lead; raw latitude /
    // longitude live inside a collapsed advanced disclosure.
    expect(screen.getByRole('combobox', { name: 'Search for a place' })).toBeEnabled();
    const disclosure = screen.getByText('Enter coordinates manually (advanced)');
    const details = disclosure.closest('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(details!.contains(screen.getByLabelText('Latitude'))).toBe(true);
    expect(details!.contains(screen.getByLabelText('Longitude'))).toBe(true);

    // The manual path stays keyboard usable once opened.
    fireEvent.click(disclosure);
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-36.85' } });
    expect(onChange).toHaveBeenCalledWith('-36.85', '');
    expect(container.querySelector('[data-map-id="production-map-id"]')).toBeInTheDocument();
  });

  it('degrades to map and manual entry when the Places service rejects predictions', async () => {
    mockState.getPlacePredictions.mockImplementation(
      (request: unknown, callback: (predictions: unknown, status: string) => void) => {
        callback(null, 'REQUEST_DENIED');
      },
    );
    const onChange = vi.fn();
    render(<CoordinatePicker latitude="" longitude="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Search for a place' }), {
      target: { value: 'mt eden' },
    });

    expect(await screen.findByText(/Place search is unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    // The map and manual coordinate entry keep working.
    fireEvent.click(screen.getByRole('button', { name: 'Mock map click' }));
    expect(onChange).toHaveBeenCalledWith('-36.850000', '174.760000');
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '174.76' } });
    expect(onChange).toHaveBeenCalledWith('', '174.76');
  });

  it('degrades to map and manual entry when the Places library never loads', () => {
    vi.useFakeTimers();
    mockState.placesLibrary.current = null;
    const onChange = vi.fn();
    render(<CoordinatePicker latitude="" longitude="" onChange={onChange} />);

    // While loading, the search input is disabled; after the timeout the
    // truthful degradation note replaces it instead of waiting forever.
    expect(screen.getByRole('combobox', { name: 'Search for a place' })).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(11_000);
    });
    expect(screen.getByText(/Place search is unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mock map click' }));
    expect(onChange).toHaveBeenCalledWith('-36.850000', '174.760000');
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '-36.85' } });
    expect(onChange).toHaveBeenCalledWith('-36.85', '');
  });
});
