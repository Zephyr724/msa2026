import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CompletionCodeSection from '../../src/components/organizer/CompletionCodeSection';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import { useUiStore } from '../../src/stores/useUiStore';
import {
  createTestQueryClient,
  jsonResponse,
  managedQuestDetail,
} from '../organizerTestUtils';

const REVEALED_CODE = 'ABCDE-23456';
const ROTATED_CODE = 'FGHJK-789AB';

const unconfiguredStatus = {
  isConfigured: false,
  validFromUtc: null,
  validToUtc: null,
  createdAtUtc: null,
};

const configuredStatus = {
  isConfigured: true,
  validFromUtc: '2026-07-25T08:00:00.0000000+00:00',
  validToUtc: '2026-08-01T11:30:00.000Z',
  createdAtUtc: '2026-07-25T08:00:00.0000000+00:00',
};

function generatedBody(code: string) {
  return {
    code,
    validFromUtc: '2026-07-25T08:00:00.0000000+00:00',
    validToUtc: '2026-08-01T11:30:00.000Z',
  };
}

interface FakeApiOptions {
  statusQueue?: Response[];
  postResponse?: Response;
  postResponses?: Response[];
  hangStatusAfterQueue?: boolean;
}

/** Routes fetch calls like the real API: CSRF token, status GET, generate POST. */
function stubCompletionApi({
  statusQueue = [],
  postResponse,
  postResponses,
  hangStatusAfterQueue = false,
}: FakeApiOptions) {
  const statuses = [...statusQueue];
  const posts = [...(postResponses ?? (postResponse ? [postResponse] : []))];
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/v1/auth/csrf-token')) {
      return Promise.resolve(jsonResponse({ token: 'csrf-completion' }));
    }
    if (url.includes('/v1/organizer/quests/') && url.endsWith('/completion-codes')) {
      if (init?.method === 'POST') {
        const next = posts.shift();
        return Promise.resolve(next ?? jsonResponse({ detail: 'Unexpected POST.' }, 500));
      }
      const next = statuses.shift();
      if (next) return Promise.resolve(next);
      return hangStatusAfterQueue
        ? new Promise<Response>(() => {})
        : Promise.resolve(jsonResponse(unconfiguredStatus));
    }
    return Promise.resolve(jsonResponse({ detail: 'Unexpected request.' }, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderSection(
  questOverrides: Parameters<typeof managedQuestDetail>[0] = { status: 'Published' },
  queryClient = createTestQueryClient(),
) {
  const quest = managedQuestDetail(questOverrides);
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CompletionCodeSection quest={quest} />
    </QueryClientProvider>,
  );
  return { ...view, quest, queryClient };
}

/** Direct cache/storage/global-state inspection — DOM assertions alone are insufficient. */
function expectPlaintextAbsentEverywhere(queryClient: QueryClient, code: string) {
  const queryData = queryClient.getQueryCache().findAll()
    .map((query) => JSON.stringify(query.state.data ?? null))
    .join('\n');
  expect(queryData).not.toContain(code);

  const mutationData = queryClient.getMutationCache().getAll()
    .map((mutation) => JSON.stringify({
      data: mutation.state.data ?? null,
      variables: mutation.state.variables ?? null,
    }))
    .join('\n');
  expect(mutationData).not.toContain(code);
  expect(queryClient.getMutationCache().getAll()).toHaveLength(0);

  expect(JSON.stringify(useUiStore.getState())).not.toContain(code);
  expect(JSON.stringify({ ...localStorage })).not.toContain(code);
  expect(JSON.stringify({ ...sessionStorage })).not.toContain(code);
  expect(window.location.href).not.toContain(code);
}

describe('Organizer completion code section', () => {
  beforeEach(() => {
    resetCsrfToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows a loading state while status is fetched', () => {
    stubCompletionApi({});
    renderSection();

    expect(screen.getByText('Loading completion code status…')).toBeInTheDocument();
  });

  it('permits generation from the empty not-configured state', async () => {
    stubCompletionApi({ statusQueue: [jsonResponse(unconfiguredStatus)] });
    renderSection();

    expect(await screen.findByText('No completion code is active for this quest.'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate completion code' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Rotate code' })).not.toBeInTheDocument();
  });

  it('shows active status metadata with a Rotate action and no plaintext promise', async () => {
    stubCompletionApi({ statusQueue: [jsonResponse(configuredStatus)] });
    renderSection();

    expect(await screen.findByText('Valid from')).toBeInTheDocument();
    expect(screen.getByText('Valid until')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText(/cannot be viewed again/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rotate code' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Generate completion code' }))
      .not.toBeInTheDocument();
  });

  it('explains why a Draft quest cannot generate and offers no action', async () => {
    stubCompletionApi({ statusQueue: [jsonResponse(unconfiguredStatus)] });
    renderSection({ status: 'Draft' });

    expect(await screen.findByText('No completion code is active for this quest.'))
      .toBeInTheDocument();
    expect(screen.getByText('Publish this Quest before generating a completion code.'))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generate completion code' }))
      .not.toBeInTheDocument();
  });

  it('reveals the returned plaintext once after successful generation', async () => {
    const user = userEvent.setup();
    const fetchMock = stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus), jsonResponse(configuredStatus)],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
    });
    const { queryClient } = renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));

    expect(await screen.findByText('Your new completion code')).toBeInTheDocument();
    expect(screen.getByLabelText('New completion code')).toHaveValue(REVEALED_CODE);
    expect(screen.getByText(/shown only once and cannot be viewed again/i)).toBeInTheDocument();
    // The reveal surface receives focus for keyboard and screen-reader users.
    expect(screen.getByRole('group', { name: 'Your new completion code' })).toHaveFocus();
    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(postCall?.[0]).toContain('/api/v1/organizer/quests/');
    expect(postCall?.[0]).toContain('/completion-codes');
    expect(postCall?.[1]?.body).toBeUndefined();
    // Status metadata is refreshed after generation.
    await waitFor(() => expect(screen.getByText('Valid from')).toBeInTheDocument());
    expectPlaintextAbsentFromCachesOnly(queryClient, REVEALED_CODE);
  });

  it('reveals the plaintext immediately even when the status refetch stalls', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus)],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
      hangStatusAfterQueue: true,
    });
    const { queryClient } = renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));

    // The metadata GET never resolves, yet the one-time code must appear.
    expect(await screen.findByText('Your new completion code')).toBeInTheDocument();
    expect(screen.getByLabelText('New completion code')).toHaveValue(REVEALED_CODE);
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeEnabled();
    expectPlaintextAbsentFromCachesOnly(queryClient, REVEALED_CODE);
  });

  it('preserves the visible still-active code when a rotation is rejected', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [
        jsonResponse(unconfiguredStatus),
        jsonResponse(configuredStatus),
        jsonResponse(configuredStatus),
      ],
      postResponses: [
        jsonResponse(generatedBody(REVEALED_CODE), 201),
        jsonResponse(
          { detail: 'The Completion Code validity window is empty.' },
          409,
        ),
      ],
    });
    const { queryClient } = renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    expect((await screen.findByLabelText('New completion code'))).toHaveValue(REVEALED_CODE);

    await user.click((await screen.findAllByRole('button', { name: 'Rotate code' })).at(-1)!);
    const confirmButtons = await screen.findAllByRole('button', { name: 'Rotate code' });
    await user.click(confirmButtons.at(-1)!);

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('The Completion Code validity window is empty.');
    // The failed rotation must not destroy the only copy of the active code.
    expect(screen.getByLabelText('New completion code')).toHaveValue(REVEALED_CODE);
    const queryData = queryClient.getQueryCache().findAll()
      .map((query) => JSON.stringify(query.state.data ?? null))
      .join('\n');
    expect(queryData).not.toContain(REVEALED_CODE);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(JSON.stringify({ ...localStorage })).not.toContain(REVEALED_CODE);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(REVEALED_CODE);
    expect(window.location.href).not.toContain(REVEALED_CODE);
  });

  it('keeps the revealed plaintext out of every cache, store, storage, and the URL', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus), jsonResponse(configuredStatus)],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
    });
    const { queryClient } = renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    expect((await screen.findByLabelText('New completion code'))).toHaveValue(REVEALED_CODE);

    const queryData = queryClient.getQueryCache().findAll()
      .map((query) => JSON.stringify(query.state.data ?? null))
      .join('\n');
    expect(queryData).not.toContain(REVEALED_CODE);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(JSON.stringify(useUiStore.getState())).not.toContain(REVEALED_CODE);
    expect(JSON.stringify({ ...localStorage })).not.toContain(REVEALED_CODE);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(REVEALED_CODE);
    expect(window.location.href).not.toContain(REVEALED_CODE);
  });

  it('copies the visible code only on explicit action and confirms without the raw value', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus), jsonResponse(configuredStatus)],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
    });
    renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    await screen.findByLabelText('New completion code');
    expect(writeText).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith(REVEALED_CODE);
    const feedback = await screen.findByRole('status');
    expect(feedback).toHaveTextContent('Code copied to clipboard.');
    expect(feedback.textContent).not.toContain(REVEALED_CODE);
  });

  it('handles clipboard failure gracefully without losing the reveal', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus), jsonResponse(configuredStatus)],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
    });
    renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    await user.click(await screen.findByRole('button', { name: 'Copy code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('Copying failed. Select the code and copy it manually.');
    expect(screen.getByLabelText('New completion code')).toHaveValue(REVEALED_CODE);
  });

  it('removes the plaintext from the UI and all state on dismissal', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus), jsonResponse(configuredStatus)],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
    });
    const { queryClient } = renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    await screen.findByLabelText('New completion code');
    await user.click(screen.getByRole('button', { name: 'Done — I have saved the code' }));

    expect(screen.queryByLabelText('New completion code')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(REVEALED_CODE);
    expectPlaintextAbsentEverywhere(queryClient, REVEALED_CODE);
  });

  it('does not restore the plaintext after unmount and remount', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    stubCompletionApi({
      statusQueue: [
        jsonResponse(unconfiguredStatus),
        jsonResponse(configuredStatus),
        jsonResponse(configuredStatus),
      ],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
    });
    const first = renderSection({ status: 'Published' }, queryClient);

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    await screen.findByLabelText('New completion code');
    first.unmount();

    render(
      <QueryClientProvider client={queryClient}>
        <CompletionCodeSection quest={managedQuestDetail({ status: 'Published' })} />
      </QueryClientProvider>,
    );

    await screen.findByText('Valid from');
    expect(screen.queryByLabelText('New completion code')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(REVEALED_CODE);
    expectPlaintextAbsentEverywhere(queryClient, REVEALED_CODE);
  });

  it('requires explicit confirmation before rotation and reveals only the new code', async () => {
    const user = userEvent.setup();
    const fetchMock = stubCompletionApi({
      statusQueue: [jsonResponse(configuredStatus), jsonResponse(configuredStatus)],
      postResponse: jsonResponse(generatedBody(ROTATED_CODE), 201),
    });
    const { queryClient } = renderSection();

    await user.click(await screen.findByRole('button', { name: 'Rotate code' }));

    expect(await screen.findByText('Rotate completion code?')).toBeInTheDocument();
    expect(screen.getByText(/stops working as soon as the new one is created/i))
      .toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Keep current code' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Rotate code' })).toHaveLength(1);
    });

    await user.click(screen.getByRole('button', { name: 'Rotate code' }));
    const confirmButtons = await screen.findAllByRole('button', { name: 'Rotate code' });
    expect(confirmButtons).toHaveLength(2);
    await user.click(confirmButtons.at(-1)!);

    expect((await screen.findByLabelText('New completion code'))).toHaveValue(ROTATED_CODE);
    expect(screen.getByText('The previous code stopped working immediately.'))
      .toBeInTheDocument();
    expect(document.body.textContent).not.toContain(REVEALED_CODE);
    const queryData = queryClient.getQueryCache().findAll()
      .map((query) => JSON.stringify(query.state.data ?? null))
      .join('\n');
    expect(queryData).not.toContain(ROTATED_CODE);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it('replaces and clears the earlier plaintext after a later rotation', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [
        jsonResponse(unconfiguredStatus),
        jsonResponse(configuredStatus),
        jsonResponse(configuredStatus),
      ],
      postResponses: [
        jsonResponse(generatedBody(REVEALED_CODE), 201),
        jsonResponse(generatedBody(ROTATED_CODE), 201),
      ],
    });
    const { queryClient } = renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    expect((await screen.findByLabelText('New completion code'))).toHaveValue(REVEALED_CODE);

    await user.click((await screen.findAllByRole('button', { name: 'Rotate code' })).at(-1)!);
    const confirmButtons = await screen.findAllByRole('button', { name: 'Rotate code' });
    await user.click(confirmButtons.at(-1)!);

    expect((await screen.findByLabelText('New completion code'))).toHaveValue(ROTATED_CODE);
    expect(document.body.textContent).not.toContain(REVEALED_CODE);
    expectPlaintextAbsentEverywhere(queryClient, REVEALED_CODE);
    expectPlaintextAbsentEverywhere(queryClient, ROTATED_CODE);
  });

  it('shows a recoverable error and never fabricates plaintext when generation fails', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus)],
      postResponse: jsonResponse({ detail: 'Server error.' }, 500),
    });
    renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('The completion code could not be updated. Please try again.');
    expect(screen.queryByLabelText('New completion code')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate completion code' })).toBeEnabled();
  });

  it('keeps the dialog open with the server error when rotation is rejected', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [jsonResponse(configuredStatus), jsonResponse(configuredStatus)],
      postResponse: jsonResponse(
        { detail: 'The Completion Code validity window is empty.' },
        409,
      ),
    });
    renderSection();

    await user.click(await screen.findByRole('button', { name: 'Rotate code' }));
    const confirmButtons = await screen.findAllByRole('button', { name: 'Rotate code' });
    expect(confirmButtons).toHaveLength(2);
    await user.click(confirmButtons.at(-1)!);

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('The Completion Code validity window is empty.');
    expect(screen.getByText('Rotate completion code?')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Rotate code' })).toHaveLength(2);
    expect(screen.queryByLabelText('New completion code')).not.toBeInTheDocument();
  });

  it('hides management actions behind the server 403 response', async () => {
    stubCompletionApi({
      statusQueue: [jsonResponse({ detail: 'You do not own this Quest.' }, 403)],
    });
    renderSection();

    expect((await screen.findByRole('alert')))
      .toHaveTextContent("You don't have access to manage completion codes for this quest.");
    expect(screen.queryByRole('button', { name: 'Generate completion code' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rotate code' })).not.toBeInTheDocument();
  });

  it('offers a retry when the status request fails', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [
        jsonResponse({ detail: 'Server error.' }, 500),
        jsonResponse(unconfiguredStatus),
      ],
    });
    renderSection();

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('We could not load the completion code status.');
    await user.click(screen.getByRole('button', { name: 'Retry status' }));

    expect(await screen.findByText('No completion code is active for this quest.'))
      .toBeInTheDocument();
  });

  it('shows a bounded unavailable message when the status endpoint answers 404', async () => {
    stubCompletionApi({
      statusQueue: [jsonResponse({ detail: 'Quest not found.' }, 404)],
    });
    renderSection();

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('This quest is no longer available to manage.');
    expect(screen.queryByRole('button', { name: 'Generate completion code' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rotate code' })).not.toBeInTheDocument();
  });

  it('shows bounded rate-limit feedback when the status endpoint answers 429', async () => {
    stubCompletionApi({
      statusQueue: [jsonResponse({}, 429)],
    });
    renderSection();

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('Too many requests. Please wait before trying again.');
    expect(screen.queryByRole('button', { name: 'Generate completion code' }))
      .not.toBeInTheDocument();
  });

  it('shows bounded rate-limit feedback when generation answers 429', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [jsonResponse(unconfiguredStatus)],
      postResponse: new Response(JSON.stringify({}), {
        status: 429,
        headers: { 'Retry-After': '600', 'Content-Type': 'application/json' },
      }),
    });
    renderSection();

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));

    expect((await screen.findByRole('alert')))
      .toHaveTextContent('Too many attempts. Please try again in about 10 minutes.');
    expect(screen.queryByLabelText('New completion code')).not.toBeInTheDocument();
  });

  it('clears the revealed code when the managed quest changes', async () => {
    const user = userEvent.setup();
    stubCompletionApi({
      statusQueue: [
        jsonResponse(unconfiguredStatus),
        jsonResponse(configuredStatus),
        jsonResponse(unconfiguredStatus),
      ],
      postResponse: jsonResponse(generatedBody(REVEALED_CODE), 201),
    });
    const queryClient = createTestQueryClient();
    const questA = managedQuestDetail({ status: 'Published' });
    const questB = managedQuestDetail({
      id: '99999999-9999-4999-8999-999999999999',
      status: 'Published',
    });
    function Harness({ quest }: { quest: ReturnType<typeof managedQuestDetail> }) {
      return (
        <QueryClientProvider client={queryClient}>
          <CompletionCodeSection key={quest.id} quest={quest} />
        </QueryClientProvider>
      );
    }
    const view = render(<Harness quest={questA} />);

    await user.click(await screen.findByRole('button', { name: 'Generate completion code' }));
    expect((await screen.findByLabelText('New completion code'))).toHaveValue(REVEALED_CODE);

    view.rerender(<Harness quest={questB} />);

    expect(await screen.findByText('No completion code is active for this quest.'))
      .toBeInTheDocument();
    expect(screen.queryByLabelText('New completion code')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(REVEALED_CODE);
    expectPlaintextAbsentEverywhere(queryClient, REVEALED_CODE);
  });
});

function expectPlaintextAbsentFromCachesOnly(queryClient: QueryClient, code: string) {
  const queryData = queryClient.getQueryCache().findAll()
    .map((query) => JSON.stringify(query.state.data ?? null))
    .join('\n');
  expect(queryData).not.toContain(code);
  expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
}
