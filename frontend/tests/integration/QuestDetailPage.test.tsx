import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ApiError } from '../../src/lib/api/apiFetch';
import QuestDetailPage from '../../src/pages/QuestDetailPage';
import { useQuestDetail, useQuestImages, useQuestList } from '../../src/hooks/useQuests';
import {
  useMyQuestCompletionQuery,
  useQuestRewardResolution,
} from '../../src/hooks/useCompletion';

vi.mock('../../src/hooks/useQuests', () => ({
  useQuestDetail: vi.fn(),
  useQuestImages: vi.fn(),
  useQuestList: vi.fn(),
}));

vi.mock('../../src/hooks/useCompletion', () => ({
  useMyQuestCompletionQuery: vi.fn(),
  useQuestRewardResolution: vi.fn(),
}));

vi.mock('../../src/components/quest/QuestParticipationPanel', () => ({
  default: () => null,
}));

vi.mock('../../src/components/quest/QuestCompletionPanel', () => ({
  default: () => null,
}));

vi.mock('../../src/components/quest/QuestCompletionMethods', () => ({
  default: () => null,
}));

const mockUseQuestDetail = vi.mocked(useQuestDetail);
const mockUseQuestImages = vi.mocked(useQuestImages);
const mockUseQuestList = vi.mocked(useQuestList);
const mockUseMyQuestCompletionQuery = vi.mocked(useMyQuestCompletionQuery);
const mockUseQuestRewardResolution = vi.mocked(useQuestRewardResolution);

const questDetail = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  title: 'Harbour Cleanup',
  description: 'Restore the harbour edge.',
  category: 'CleanReduceWaste',
  sourceType: 'OrganizerOwned',
  registrationMode: 'Native',
  difficulty: 'Easy',
  xpAward: 50,
  capacity: 20,
  availableSpots: 12,
  startAtUtc: null,
  endAtUtc: null,
  locationRegion: null,
  locationDescription: 'Auckland harbour',
  coverImage: null,
  latitude: null,
  longitude: null,
  externalSourceUrl: null,
  sourceCheckedAt: null,
} as const;

function renderDetailPage() {
  const router = createMemoryRouter(
    [{ path: '/quests/:questId', element: <QuestDetailPage /> }],
    { initialEntries: ['/quests/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'] },
  );

  render(<RouterProvider router={router} />);
}

describe('Quest detail error states', () => {
  beforeEach(() => {
    mockUseQuestImages.mockReturnValue({ data: [] } as never);
    mockUseQuestList.mockReturnValue({ data: undefined } as never);
    mockUseMyQuestCompletionQuery.mockReturnValue({ data: { status: 'None' } } as never);
    mockUseQuestRewardResolution.mockReturnValue({ data: undefined } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders not found only for HTTP 404', () => {
    mockUseQuestDetail.mockReturnValue({
      data: undefined,
      error: new ApiError(404),
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    renderDetailPage();

    expect(screen.getByRole('heading', { name: 'Quest Not Found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('renders a recoverable state for non-404 failures', () => {
    mockUseQuestDetail.mockReturnValue({
      data: undefined,
      error: new ApiError(500),
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    renderDetailPage();

    expect(screen.getByRole('heading', { name: 'Unable to Load Quest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Quest Not Found' })).not.toBeInTheDocument();
  });

  it('retries a recoverable failure', () => {
    const refetch = vi.fn();
    mockUseQuestDetail.mockReturnValue({
      data: undefined,
      error: new TypeError('Network request failed'),
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    renderDetailPage();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalledOnce();
  });

  it('removes the mobile actions shortcut while the actions region is visible', async () => {
    class VisibleIntersectionObserver {
      private readonly callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
      }

      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      readonly root = null;
      readonly rootMargin = '0px 0px -112px 0px';
      readonly thresholds = [0.01];
    }
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver);
    mockUseQuestDetail.mockReturnValue({
      data: questDetail,
      error: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderDetailPage();

    expect(document.querySelector('main.kiwi-page'))
      .toHaveClass('grid-cols-[minmax(0,1fr)]');

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'View quest actions' }))
        .not.toBeInTheDocument();
    });
  });

  it('places the completion stamp over the cover and left column, with encouragement before rewards', () => {
    mockUseQuestDetail.mockReturnValue({
      data: questDetail,
      error: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseMyQuestCompletionQuery.mockReturnValue({
      data: { status: 'Verified' },
    } as never);
    mockUseQuestRewardResolution.mockReturnValue({
      data: {
        celebrationTitle: 'Green Momentum!',
        celebrationMessage: 'This completed Quest keeps practical community action growing.',
      },
    } as never);

    renderDetailPage();

    const overlay = screen.getByTestId('quest-completion-stamp-overlay');
    const stamp = overlay.querySelector('[data-stamp-band="mission-complete"]')
      ?.closest('svg');
    expect(overlay).toHaveClass('absolute', 'top-0', 'pointer-events-none');
    expect(stamp).toHaveClass('lg:w-[110%]', 'opacity-[0.08]');

    const details = screen.getByRole('region', { name: 'Quest details' });
    const celebration = screen.getByTestId('quest-completion-celebration');
    const rewards = screen.getByRole('heading', { name: 'Rewards for completing' })
      .closest('section')!;
    expect(screen.getByRole('heading', { name: 'Green Momentum!' }))
      .toHaveClass('kiwi-celebration-title');
    expect(screen.getByText('This completed Quest keeps practical community action growing.'))
      .toHaveClass('font-bold', 'text-base-content');
    expect(details.compareDocumentPosition(celebration) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    expect(celebration.compareDocumentPosition(rewards) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });
});
