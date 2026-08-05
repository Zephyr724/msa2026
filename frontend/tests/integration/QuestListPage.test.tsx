import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import QuestListPage from '../../src/pages/QuestListPage';
import { useQuestList } from '../../src/hooks/useQuests';
import { useCities, useRegions } from '../../src/hooks/useRegions';
import type { QuestListItemDto } from '../../src/types/quest';

vi.mock('../../src/hooks/useQuests', () => ({
  useQuestList: vi.fn(),
}));

vi.mock('../../src/hooks/useRegions', () => ({
  useCities: vi.fn(),
  useRegions: vi.fn(),
}));

vi.mock('../../src/lib/googleMapsConfig', () => ({
  googleMapsConfig: {
    apiKey: null,
    mapId: null,
    isConfigured: false,
  },
}));

const mockUseQuestList = vi.mocked(useQuestList);
const mockUseRegions = vi.mocked(useRegions);
const mockUseCities = vi.mocked(useCities);

const datedQuest: QuestListItemDto = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  title: 'Dated Stream Cleanup',
  description: 'A dated quest.',
  category: 'CleanReduceWaste',
  sourceType: 'OrganizerOwned',
  registrationMode: 'Native',
  difficulty: 'Easy',
  xpAward: 50,
  capacity: 30,
  startAtUtc: '2026-08-01T00:00:00Z',
  endAtUtc: null,
  locationRegion: null,
  locationDescription: null,
  latitude: -36.8747,
  longitude: 174.6285,
  coverImage: {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    imageUrl: '/images/quests/stream-cleanup.svg',
    altText: 'Volunteers cleaning a stream',
  },
};

const undatedQuest: QuestListItemDto = {
  ...datedQuest,
  id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  title: 'Undated External Quest',
  sourceType: 'AdminCuratedExternal',
  registrationMode: 'External',
  startAtUtc: null,
  latitude: null,
  longitude: null,
  coverImage: null,
};

function questPage(items: QuestListItemDto[]) {
  return {
    items,
    page: 1,
    pageSize: 12,
    totalCount: items.length,
    totalPages: items.length === 0 ? 0 : 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function renderQuestList(initialEntry = '/quests') {
  const router = createMemoryRouter(
    [{ path: '/quests', element: <QuestListPage /> }],
    { initialEntries: [initialEntry] },
  );
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

describe('Quest discovery URL and card behavior', () => {
  beforeEach(() => {
    mockUseRegions.mockReturnValue({ data: [] } as never);
    mockUseCities.mockReturnValue({ data: [] } as never);
    mockUseQuestList.mockReturnValue({
      data: questPage([]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it('restores and serializes pageSize through the URL', async () => {
    const { router } = renderQuestList('/quests?page=2&pageSize=24');

    expect(mockUseQuestList).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, pageSize: 24 }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByLabelText('Page size')).toHaveValue('24');

    fireEvent.change(screen.getByLabelText('Page size'), { target: { value: '48' } });

    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.search);
      expect(params.get('pageSize')).toBe('48');
      expect(params.get('page')).toBeNull();
    });
  });

  it('serializes City and Community as distinct hierarchy filters', async () => {
    const cityId = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
    const communityId = 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d';
    mockUseCities.mockReturnValue({
      data: [{
        id: cityId,
        name: 'Auckland',
        type: 'AdministrativeArea',
        parentRegionId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      }],
    } as never);
    mockUseRegions.mockReturnValue({
      data: [{
        id: communityId,
        name: 'Henderson-Massey',
        type: 'LocalArea',
        parentRegionId: cityId,
      }],
    } as never);
    const { router } = renderQuestList();

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: cityId },
    });
    await waitFor(() => {
      expect(new URLSearchParams(router.state.location.search).get('regionId'))
        .toBe(cityId);
      expect(mockUseQuestList).toHaveBeenLastCalledWith(
        expect.objectContaining({ regionId: cityId }),
      );
    });

    fireEvent.change(screen.getByLabelText('Community'), {
      target: { value: communityId },
    });
    await waitFor(() => {
      expect(new URLSearchParams(router.state.location.search).get('regionId'))
        .toBe(communityId);
      expect(mockUseQuestList).toHaveBeenLastCalledWith(
        expect.objectContaining({ regionId: communityId }),
      );
    });

    fireEvent.change(screen.getByLabelText('Community'), {
      target: { value: '' },
    });
    await waitFor(() => {
      expect(new URLSearchParams(router.state.location.search).get('regionId'))
        .toBe(cityId);
      expect(mockUseQuestList).toHaveBeenLastCalledWith(
        expect.objectContaining({ regionId: cityId }),
      );
    });
  });

  it('synchronizes the visible search input with browser navigation', async () => {
    const { router } = renderQuestList('/quests?search=first');
    expect(screen.getByLabelText('Search quests')).toHaveValue('first');

    await act(async () => {
      await router.navigate('/quests?search=second&pageSize=24');
    });
    expect(screen.getByLabelText('Search quests')).toHaveValue('second');

    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByLabelText('Search quests')).toHaveValue('first');
  });

  it('searches after a short typing pause without requiring form submission', async () => {
    vi.useFakeTimers();
    try {
      const { router } = renderQuestList();
      const input = screen.getByLabelText('Search quests');

      fireEvent.change(input, { target: { value: 'backyard' } });
      expect(new URLSearchParams(router.state.location.search).get('search')).toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(299);
      });
      expect(new URLSearchParams(router.state.location.search).get('search')).toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(new URLSearchParams(router.state.location.search).get('search'))
        .toBe('backyard');
      expect(router.state.historyAction).toBe('REPLACE');
      expect(mockUseQuestList).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'backyard' }),
      );

      fireEvent.change(input, { target: { value: '' } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(new URLSearchParams(router.state.location.search).get('search')).toBeNull();
      expect(mockUseQuestList).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ search: expect.anything() }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders dated and undated states, registration/source labels, and a missing-image fallback', () => {
    mockUseQuestList.mockReturnValue({
      data: questPage([datedQuest, undatedQuest]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    const { container } = renderQuestList();

    expect(container.querySelector('time[datetime="2026-08-01T00:00:00Z"]')).toBeInTheDocument();
    expect(screen.getByText('Schedule to be confirmed')).toBeInTheDocument();
    expect(screen.getByText('Join on Kiwimpact')).toBeInTheDocument();
    expect(screen.getByText('Organizer quest')).toBeInTheDocument();
    expect(screen.getByText('External registration')).toBeInTheDocument();
    expect(screen.getByText('Official external event')).toBeInTheDocument();
    expect(screen.getAllByText('50 XP')[0]).toHaveClass(
      'border-amber-200',
      'bg-amber-50',
      'text-amber-700',
      'dark:border-amber-700',
      'dark:bg-amber-900/30',
      'dark:text-amber-300',
    );
    expect(screen.getByRole('img', {
      name: 'Volunteers cleaning a stream',
    })).toHaveAttribute('src', expect.stringContaining('images.unsplash.com'));
    expect(screen.getByRole('img', {
      name: 'Environmental placeholder for Undated External Quest',
    })).toHaveAttribute('src', expect.stringContaining('images.unsplash.com'));
  });

  it('replaces a broken Quest image with the fallback', () => {
    const brokenImageQuest = {
      ...datedQuest,
      coverImage: {
        ...datedQuest.coverImage!,
        imageUrl: 'https://images.example.test/stream-cleanup.jpg',
      },
    };
    mockUseQuestList.mockReturnValue({
      data: questPage([brokenImageQuest]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderQuestList();
    const image = screen.getByRole('img', { name: 'Volunteers cleaning a stream' });
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', expect.stringContaining('images.unsplash.com'));
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', expect.stringContaining('picsum.photos'));
    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/images/quests/quest-fallback.svg');
  });

  it('keeps every Quest in the map result list when Google Maps is unavailable', () => {
    mockUseQuestList.mockReturnValue({
      data: questPage([datedQuest, undatedQuest]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderQuestList();

    expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: datedQuest.title })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(screen.getByText('Quest map is temporarily unavailable')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Quests shown in map view' }))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: `Details for ${datedQuest.title}` }))
      .toHaveAttribute('href', `/quests/${datedQuest.id}`);
    expect(screen.getByRole('link', { name: `Details for ${undatedQuest.title}` }))
      .toHaveAttribute('href', `/quests/${undatedQuest.id}`);
    expect(screen.getByText('Not mapped')).toBeInTheDocument();
    const mappedQuestRow = screen.getByRole('button', {
      name: new RegExp(datedQuest.title),
    });
    fireEvent.click(mappedQuestRow);
    expect(mappedQuestRow).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));
    expect(screen.getByRole('link', { name: datedQuest.title })).toBeInTheDocument();
  });
});
