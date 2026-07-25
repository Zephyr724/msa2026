import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuestCompletionPanel from '../../src/components/quest/QuestCompletionPanel';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import { useUiStore } from '../../src/stores/useUiStore';
import { createTestQueryClient, jsonResponse } from '../organizerTestUtils';

const QUEST_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const ENTERED_TYPED = 'abcde-23456';
const ENTERED_NORMALIZED = 'ABCDE23456';

const session = {
  userId: 'user-1',
  displayName: 'Aroha',
  email: 'member@example.test',
  roles: ['Member'],
};

const activeParticipation = {
  status: 'Active',
  canJoin: false,
  ineligibilityReason: 'AlreadyParticipating',
  capacityFull: false,
};

const noCompletion = {
  status: 'None',
  method: null,
  completedAtUtc: null,
  verifiedAtUtc: null,
};

const verifiedCompletion = {
  status: 'Verified',
  method: 'CompletionCode',
  completedAtUtc: '2026-07-25T09:00:00.0000000+00:00',
  verifiedAtUtc: '2026-07-25T09:00:00.0000000+00:00',
};

interface FakeApiOptions {
  authenticated?: boolean;
  participation?: unknown;
  completionQueue?: unknown[];
  redeemResponses?: Response[];
  redeemHang?: boolean;
}

function stubParticipantApi({
  authenticated = true,
  participation = activeParticipation,
  completionQueue = [noCompletion],
  redeemResponses = [],
  redeemHang = false,
}: FakeApiOptions = {}) {
  const completions = [...completionQueue];
  const redeems = [...redeemResponses];
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/v1/auth/csrf-token')) {
      return Promise.resolve(jsonResponse({ token: 'csrf-redeem' }));
    }
    if (url.endsWith('/v1/auth/me')) {
      return Promise.resolve(
        authenticated
          ? jsonResponse(session)
          : jsonResponse({ detail: 'Authentication required.' }, 401),
      );
    }
    if (url.endsWith(`/v1/quests/${QUEST_ID}/participation`)) {
      return Promise.resolve(jsonResponse(participation));
    }
    if (url.endsWith(`/v1/quests/${QUEST_ID}/completion`)) {
      const next = completions.shift();
      return Promise.resolve(jsonResponse(next ?? completions.at(-1) ?? noCompletion));
    }
    if (url.endsWith(`/v1/quests/${QUEST_ID}/redeem`) && init?.method === 'POST') {
      if (redeemHang) {
        return new Promise<Response>(() => {});
      }
      const next = redeems.shift();
      return Promise.resolve(next ?? jsonResponse(verifiedCompletion, 201));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderPanel(
  registrationMode: 'Native' | 'External' | 'NoneRequired' = 'Native',
  queryClient = createTestQueryClient(),
) {
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <QuestCompletionPanel questId={QUEST_ID} registrationMode={registrationMode} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

function redeemCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(([url, init]) =>
    String(url).endsWith('/redeem') && (init as RequestInit | undefined)?.method === 'POST');
}

describe('Participant quest completion panel', () => {
  beforeEach(() => {
    resetCsrfToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('shows an anonymous sign-in CTA without a redemption form', async () => {
    stubParticipantApi({ authenticated: false });
    renderPanel();

    expect(await screen.findByText('Sign in to redeem a completion code.'))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Redeem code' })).not.toBeInTheDocument();
  });

  it('renders nothing for quests without native registration', () => {
    stubParticipantApi();
    const { container } = renderPanel('External');

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a loading state while completion state is fetched', () => {
    stubParticipantApi();
    renderPanel();

    expect(screen.getByText(/checking completion availability|loading your completion state/i))
      .toBeInTheDocument();
  });

  it('renders the authoritative Verified state without any XP or reward UI', async () => {
    stubParticipantApi({ completionQueue: [verifiedCompletion] });
    renderPanel();

    expect(await screen.findByText('Quest completed. Nice work!')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Redeem code' })).not.toBeInTheDocument();
    const section = screen.getByRole('region', { name: 'Quest completion' });
    expect(section.textContent).not.toMatch(/XP|achievement|badge|level|leaderboard/i);
  });

  it('shows the OwnQuest explanation without a form', async () => {
    stubParticipantApi({
      participation: {
        status: 'None',
        canJoin: false,
        ineligibilityReason: 'OwnQuest',
        capacityFull: false,
      },
    });
    renderPanel();

    expect(await screen.findByText(/created this Quest, so you cannot complete it/i))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Redeem code' })).not.toBeInTheDocument();
  });

  it('asks non-participants to join before redeeming', async () => {
    stubParticipantApi({
      participation: {
        status: 'None',
        canJoin: true,
        ineligibilityReason: null,
        capacityFull: false,
      },
    });
    renderPanel();

    expect(await screen.findByText('Join this Quest before redeeming a completion code.'))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Redeem code' })).not.toBeInTheDocument();
  });

  it('redeems a typed code once, sends canonical identity and CSRF, then shows server state', async () => {
    const user = userEvent.setup();
    const fetchMock = stubParticipantApi({
      completionQueue: [noCompletion, verifiedCompletion],
    });
    renderPanel();

    const input = await screen.findByLabelText('Completion code');
    await user.type(input, ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect(await screen.findByText('Quest completed. Nice work!')).toBeInTheDocument();
    expect(screen.queryByLabelText('Completion code')).not.toBeInTheDocument();

    const posts = redeemCalls(fetchMock);
    expect(posts).toHaveLength(1);
    const [url, init] = posts[0] as [string, RequestInit];
    expect(url).toBe(`/api/v1/quests/${QUEST_ID}/redeem`);
    expect(JSON.parse(String(init.body))).toEqual({ code: ENTERED_NORMALIZED });
    expect(String(init.body)).not.toContain(session.userId);
    expect(new Headers(init.headers).get('X-CSRF-TOKEN')).toBe('csrf-redeem');
    // The Verified state comes from the refetched authoritative GET.
    expect(fetchMock.mock.calls.filter(([callUrl]) =>
      String(callUrl).endsWith('/completion')).length).toBeGreaterThanOrEqual(2);
  });

  it('shows bounded feedback for an invalid code and keeps the code out of all stores', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      redeemResponses: [jsonResponse({
        type: 'https://kiwimpact.app/problems/invalid-completion-code',
        title: 'Invalid Completion Code',
        status: 400,
        detail: 'The completion code is invalid.',
      }, 400)],
    });
    const { queryClient } = renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('That code is not valid. Check the code and try again.');

    const queryData = queryClient.getQueryCache().findAll()
      .map((query) => JSON.stringify(query.state.data ?? null))
      .join('\n');
    expect(queryData).not.toContain(ENTERED_NORMALIZED);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(JSON.stringify(useUiStore.getState())).not.toContain(ENTERED_NORMALIZED);
    expect(JSON.stringify({ ...localStorage })).not.toContain(ENTERED_NORMALIZED);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(ENTERED_NORMALIZED);
    expect(window.location.href).not.toContain(ENTERED_NORMALIZED);
  });

  it('maps a duplicate Verified 409 and converges to the authoritative completed state', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      completionQueue: [noCompletion, verifiedCompletion],
      redeemResponses: [jsonResponse({
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
        title: 'Conflict',
        status: 409,
        detail: 'You have already completed this Quest.',
      }, 409)],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect(await screen.findByText('Quest completed. Nice work!')).toBeInTheDocument();
  });

  it('maps the missing-participation 409 to the accepted detail', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      redeemResponses: [jsonResponse({
        title: 'Conflict',
        status: 409,
        detail: 'An active Quest participation is required.',
      }, 409)],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('An active Quest participation is required.');
  });

  it('maps the creator self-redemption 409 to the accepted detail', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      redeemResponses: [jsonResponse({
        title: 'Conflict',
        status: 409,
        detail: 'You cannot complete a Quest you created.',
      }, 409)],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('You cannot complete a Quest you created.');
  });

  it('maps an unsupported Quest mode 400 to a bounded message', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      redeemResponses: [jsonResponse({
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'This Quest does not support Completion Code redemption.',
      }, 400)],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('Completion codes are not available for this Quest.');
  });

  it('shows rate-limit feedback on 429, honors Retry-After, and never retries automatically', async () => {
    const user = userEvent.setup();
    const fetchMock = stubParticipantApi({
      redeemResponses: [new Response(JSON.stringify({}), {
        status: 429,
        headers: { 'Retry-After': '600', 'Content-Type': 'application/json' },
      })],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('Too many attempts. Please try again in about 10 minutes.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Redeem code' }))
      .toBeEnabled());
    expect(redeemCalls(fetchMock)).toHaveLength(1);
  });

  it('prevents duplicate simultaneous submissions while the request is active', async () => {
    const user = userEvent.setup();
    const fetchMock = stubParticipantApi({ redeemHang: true });
    renderPanel();

    const input = await screen.findByLabelText('Completion code');
    await user.type(input, ENTERED_TYPED);
    const button = screen.getByRole('button', { name: 'Redeem code' });
    await user.click(button);

    const pendingButton = await screen.findByRole('button', { name: 'Redeeming…' });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    await user.click(pendingButton);

    expect(redeemCalls(fetchMock)).toHaveLength(1);
  });

  it('validates the code shape locally without sending a request', async () => {
    const user = userEvent.setup();
    const fetchMock = stubParticipantApi();
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), 'ABC');
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('Enter the 10-character code from your Quest organizer.');
    expect(redeemCalls(fetchMock)).toHaveLength(0);
  });

  it('shows session feedback on a 401 redemption response', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      redeemResponses: [jsonResponse({ detail: 'Authentication required.' }, 401)],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('Your session has expired. Please sign in again.');
  });

  it('maps a 403 redemption rejection to bounded authorization feedback', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      redeemResponses: [jsonResponse({
        title: 'Forbidden',
        status: 403,
        detail: 'Forbidden',
      }, 403)],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('You do not have access to complete this Quest.');
  });

  it('maps a 404 redemption rejection to a bounded unavailable message', async () => {
    const user = userEvent.setup();
    stubParticipantApi({
      redeemResponses: [jsonResponse({
        title: 'Not Found',
        status: 404,
        detail: 'Quest not found.',
      }, 404)],
    });
    renderPanel();

    await user.type(await screen.findByLabelText('Completion code'), ENTERED_TYPED);
    await user.click(screen.getByRole('button', { name: 'Redeem code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('This Quest is no longer available.');
  });

  it('clears a typed code when the quest changes', async () => {
    const user = userEvent.setup();
    stubParticipantApiForAnyQuest();
    const queryClient = createTestQueryClient();
    function Harness({ questId }: { questId: string }) {
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <QuestCompletionPanel
              key={questId}
              questId={questId}
              registrationMode="Native"
            />
          </MemoryRouter>
        </QueryClientProvider>
      );
    }
    const view = render(<Harness questId={QUEST_ID} />);

    const input = await screen.findByLabelText('Completion code');
    await user.type(input, ENTERED_TYPED);
    expect(input).toHaveValue(ENTERED_TYPED);

    view.rerender(<Harness questId="b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e" />);

    expect((await screen.findByLabelText('Completion code'))).toHaveValue('');
    expect(JSON.stringify(useUiStore.getState())).not.toContain(ENTERED_NORMALIZED);
    expect(JSON.stringify({ ...localStorage })).not.toContain(ENTERED_NORMALIZED);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(ENTERED_NORMALIZED);
  });

  it('recovers from a failed completion-state load with an explicit retry', async () => {
    const user = userEvent.setup();
    const fetchMock = stubParticipantApiFailureOnce();
    renderPanel();

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('We could not load your completion state.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByLabelText('Completion code')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});

/** First completion GET fails; subsequent ones succeed. */
function stubParticipantApiFailureOnce() {
  let completionAttempts = 0;
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
    if (url.endsWith(`/v1/quests/${QUEST_ID}/participation`)) {
      return Promise.resolve(jsonResponse(activeParticipation));
    }
    if (url.endsWith(`/v1/quests/${QUEST_ID}/completion`)) {
      completionAttempts += 1;
      return completionAttempts === 1
        ? Promise.resolve(jsonResponse({ detail: 'Server error.' }, 500))
        : Promise.resolve(jsonResponse(noCompletion));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Serves any quest id, for the quest-switch reset test. */
function stubParticipantApiForAnyQuest() {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/v1/auth/me')) return Promise.resolve(jsonResponse(session));
    if (url.includes('/participation')) {
      return Promise.resolve(jsonResponse(activeParticipation));
    }
    if (url.includes('/completion')) {
      return Promise.resolve(jsonResponse(noCompletion));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
