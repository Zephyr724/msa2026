import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CoordinatePicker } from '../../src/components/maps/CoordinatePicker';
import { QuestMap } from '../../src/components/maps/QuestMap';
import type { QuestListItemDto } from '../../src/types/quest';

const setCenter = vi.fn();
const setZoom = vi.fn();
const panTo = vi.fn();
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
  googleMapsConfig: {
    apiKey: 'restricted-browser-key',
    mapId: 'production-map-id',
    isConfigured: true,
  },
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
}));

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
