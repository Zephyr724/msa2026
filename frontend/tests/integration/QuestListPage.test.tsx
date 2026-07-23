import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import QuestListPage from '../../src/pages/QuestListPage';
import { useQuestList } from '../../src/hooks/useQuests';
import { useRegions } from '../../src/hooks/useRegions';
import type { QuestListItemDto } from '../../src/types/quest';

vi.mock('../../src/hooks/useQuests', () => ({
  useQuestList: vi.fn(),
}));

vi.mock('../../src/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

const mockUseQuestList = vi.mocked(useQuestList);
const mockUseRegions = vi.mocked(useRegions);

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
    expect(screen.getByLabelText('Page size')).toHaveValue('24');

    fireEvent.change(screen.getByLabelText('Page size'), { target: { value: '48' } });

    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.search);
      expect(params.get('pageSize')).toBe('48');
      expect(params.get('page')).toBeNull();
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
    expect(screen.getByText('Registration: Native')).toBeInTheDocument();
    expect(screen.getByText('Source: OrganizerOwned')).toBeInTheDocument();
    expect(screen.getByText('Registration: External')).toBeInTheDocument();
    expect(screen.getByText('Source: AdminCuratedExternal')).toBeInTheDocument();
    expect(screen.getByRole('img', {
      name: 'Fallback illustration for Undated External Quest',
    })).toHaveAttribute('src', '/images/quests/quest-fallback.svg');
  });

  it('replaces a broken Quest image with the fallback', () => {
    mockUseQuestList.mockReturnValue({
      data: questPage([datedQuest]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderQuestList();
    fireEvent.error(screen.getByRole('img', { name: 'Volunteers cleaning a stream' }));

    expect(screen.getByRole('img', {
      name: 'Fallback illustration for Dated Stream Cleanup',
    })).toHaveAttribute('src', '/images/quests/quest-fallback.svg');
  });
});
