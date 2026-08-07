import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestParticipationPanel from '../../src/components/quest/QuestParticipationPanel';
import { useAuthQuery } from '../../src/hooks/useAuth';
import {
  useCancelQuestParticipationMutation,
  useJoinQuestMutation,
  useMyQuestParticipationQuery,
} from '../../src/hooks/useParticipation';
import { ApiError } from '../../src/lib/api/apiFetch';
import { useUiStore } from '../../src/stores/useUiStore';

vi.mock('../../src/hooks/useAuth', () => ({ useAuthQuery: vi.fn() }));
vi.mock('../../src/hooks/useParticipation', () => ({
  useMyQuestParticipationQuery: vi.fn(),
  useJoinQuestMutation: vi.fn(),
  useCancelQuestParticipationMutation: vi.fn(),
}));

const mockAuth = vi.mocked(useAuthQuery);
const mockParticipation = vi.mocked(useMyQuestParticipationQuery);
const mockJoin = vi.mocked(useJoinQuestMutation);
const mockCancel = vi.mocked(useCancelQuestParticipationMutation);
const join = vi.fn();
const cancel = vi.fn();
const refetch = vi.fn();

describe('Quest participation panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue(authResult(['Member']) as never);
    mockParticipation.mockReturnValue(participationResult({
      status: 'None',
      canJoin: true,
      ineligibilityReason: null,
      capacityFull: false,
    }) as never);
    mockJoin.mockReturnValue(mutationResult(join) as never);
    mockCancel.mockReturnValue(mutationResult(cancel) as never);
  });

  it('shows an anonymous sign-in CTA and does not render a Join button', () => {
    mockAuth.mockReturnValue({ data: null, isPending: false } as never);

    renderPanel();

    expect(screen.getByRole('link', { name: 'Sign in to join' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Join Quest' })).not.toBeInTheDocument();
  });

  it('joins an eligible Quest with an accessible, keyboard-usable control', async () => {
    renderPanel();

    const button = screen.getByRole('button', { name: 'Join Quest' });
    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(button).toHaveFocus();
    expect(join).toHaveBeenCalledOnce();
  });

  it('shows Joined and requires inline confirmation before cancellation', async () => {
    mockParticipation.mockReturnValue(participationResult({
      status: 'Active',
      canJoin: false,
      ineligibilityReason: 'AlreadyParticipating',
      capacityFull: false,
    }) as never);
    renderPanel();

    expect(screen.getByText('You have joined this Quest.')).toBeInTheDocument();
    const cancelTrigger = screen.getByRole('button', { name: 'Cancel participation' });
    expect(cancelTrigger).toHaveClass('btn-error');
    await userEvent.click(cancelTrigger);
    expect(cancel).not.toHaveBeenCalled();

    const confirmCancellation = screen.getByRole('button', { name: 'Confirm cancellation' });
    expect(confirmCancellation).toHaveClass('btn-error');
    expect(confirmCancellation).toHaveClass('w-full');
    const keepParticipation = screen.getByRole('button', { name: 'Keep participation' });
    expect(keepParticipation).toHaveClass('btn-success', 'w-full');
    await userEvent.click(confirmCancellation);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it.each(['Verified', 'SelfReported'] as const)(
    'removes the cancellation entry for a %s Quest',
    (completionStatus) => {
      mockParticipation.mockReturnValue(participationResult({
        status: 'Active',
        canJoin: false,
        ineligibilityReason: 'AlreadyParticipating',
        capacityFull: false,
      }) as never);

      renderPanel('Native', completionStatus);

      expect(screen.getByText('You have joined this Quest.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancel participation' }))
        .not.toBeInTheDocument();
      expect(screen.queryByText(/Cancel your participation/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Confirm cancellation' }))
        .not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Keep participation' }))
        .not.toBeInTheDocument();
    },
  );

  it('shows OwnQuest explanation and never sends a Join mutation', async () => {
    mockParticipation.mockReturnValue(participationResult({
      status: 'None',
      canJoin: false,
      ineligibilityReason: 'OwnQuest',
      capacityFull: false,
    }) as never);
    renderPanel();

    expect(screen.getByText(/created this Quest, so you cannot join/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument();
    await userEvent.tab();
    expect(join).not.toHaveBeenCalled();
  });

  it.each([['Organizer'], ['Admin']])(
    '%s sees Join for another creator when the server says eligible',
    (role) => {
      mockAuth.mockReturnValue(authResult([role]) as never);

      renderPanel();

      expect(screen.getByRole('button', { name: 'Join Quest' })).toBeEnabled();
    },
  );

  it('prevents duplicate actions while a mutation is pending', async () => {
    mockJoin.mockReturnValue(mutationResult(join, { isPending: true }) as never);
    renderPanel();

    const button = screen.getByRole('button', { name: 'Joining…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(join).not.toHaveBeenCalled();
  });

  it('shows capacity-full state with no numeric participant count', () => {
    mockParticipation.mockReturnValue(participationResult({
      status: 'None',
      canJoin: false,
      ineligibilityReason: 'CapacityFull',
      capacityFull: true,
    }) as never);

    renderPanel();

    expect(screen.getByText(/Quest is full/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument();
  });

  it('safely presents a stale OwnQuest 409 returned by the server', () => {
    mockJoin.mockReturnValue(mutationResult(join, {
      error: new ApiError(409, {
        title: 'Conflict',
        detail: 'You cannot join a Quest you created.',
      }),
    }) as never);

    renderPanel();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You cannot join a Quest you created.',
    );
  });

  it('renders unsupported registration without participation controls', () => {
    mockParticipation.mockReturnValue(participationResult({
      status: 'None',
      canJoin: false,
      ineligibilityReason: 'RegistrationModeNotSupported',
      capacityFull: false,
    }) as never);

    renderPanel('External');

    expect(screen.getByText(/managed by the original event provider/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps participation state out of Zustand', () => {
    renderPanel();

    expect(useUiStore.getState()).not.toHaveProperty('participation');
    expect(useUiStore.getState()).not.toHaveProperty('quest');
    expect(useUiStore.getState()).not.toHaveProperty('identity');
  });
});

function renderPanel(
  registrationMode: 'Native' | 'External' | 'NoneRequired' = 'Native',
  completionStatus: 'None' | 'Pending' | 'Verified' | 'Rejected' | 'SelfReported' | null = 'None',
) {
  return render(
    <MemoryRouter>
      <QuestParticipationPanel
        completionStatus={completionStatus}
        questId="a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
        registrationMode={registrationMode}
      />
    </MemoryRouter>,
  );
}

function authResult(roles: string[]) {
  return {
    data: {
      userId: 'user-1',
      displayName: 'Aroha',
      email: 'member@example.test',
      roles,
    },
    isPending: false,
  };
}

function participationResult(data: {
  status: 'None' | 'Active' | 'Cancelled';
  canJoin: boolean;
  ineligibilityReason:
    | 'OwnQuest'
    | 'AlreadyParticipating'
    | 'QuestNotPublished'
    | 'RegistrationModeNotSupported'
    | 'QuestEnded'
    | 'CapacityFull'
    | null;
  capacityFull: boolean;
}) {
  return {
    data,
    isPending: false,
    isError: false,
    refetch,
  };
}

function mutationResult(
  mutateAsync: ReturnType<typeof vi.fn>,
  overrides: { isPending?: boolean; error?: Error | null } = {},
) {
  mutateAsync.mockResolvedValue({});
  return {
    mutateAsync,
    isPending: overrides.isPending ?? false,
    error: overrides.error ?? null,
  };
}
