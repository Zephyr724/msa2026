import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ApiError } from '../../src/lib/api/apiFetch';
import QuestDetailPage from '../../src/pages/QuestDetailPage';
import { useQuestDetail, useQuestImages } from '../../src/hooks/useQuests';

vi.mock('../../src/hooks/useQuests', () => ({
  useQuestDetail: vi.fn(),
  useQuestImages: vi.fn(),
}));

vi.mock('../../src/components/quest/QuestParticipationPanel', () => ({
  default: () => null,
}));

vi.mock('../../src/components/quest/QuestCompletionPanel', () => ({
  default: () => null,
}));

const mockUseQuestDetail = vi.mocked(useQuestDetail);
const mockUseQuestImages = vi.mocked(useQuestImages);

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
});
