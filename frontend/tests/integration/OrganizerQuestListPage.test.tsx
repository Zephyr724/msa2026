import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import OrganizerQuestListPage from '../../src/pages/OrganizerQuestListPage';
import {
  jsonResponse,
  managedQuestDetail,
  managedQuestListItem,
  renderWithRouter,
} from '../organizerTestUtils';

describe('Organizer Quest list', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('renders loading, empty, and recoverable error states', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    ));
    const first = renderList();
    expect(screen.getByText('Loading managed quests…')).toBeInTheDocument();
    resolveFetch(jsonResponse([]));
    expect(await screen.findByRole('heading', { name: 'No quests yet' })).toBeInTheDocument();
    first.unmount();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    renderList();
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows status text and only the lifecycle actions allowed for each status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([
      managedQuestListItem('Draft', { id: '11111111-1111-4111-8111-111111111111' }),
      managedQuestListItem('Published', { id: '22222222-2222-4222-8222-222222222222', title: 'Published quest' }),
      managedQuestListItem('Cancelled', { id: '33333333-3333-4333-8333-333333333333', title: 'Cancelled quest' }),
      managedQuestListItem('Archived', { id: '44444444-4444-4444-8444-444444444444', title: 'Archived quest' }),
    ])));
    renderList();

    expect(await screen.findByText('Published quest')).toBeInTheDocument();
    expect(screen.getAllByText(/^(Draft|Published|Cancelled|Archived)$/)).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Publish quest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel quest' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Archive quest' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/organizer/quests/44444444-4444-4444-8444-444444444444/edit',
    );
    expect(screen.getAllByRole('button', { name: 'Delete draft' })).toHaveLength(1);
  });

  it('confirms publish, sends the row version through apiFetch, and refreshes the list', async () => {
    const user = userEvent.setup();
    const draft = managedQuestListItem();
    const published = managedQuestDetail({ status: 'Published', version: 8 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([draft]))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-publish' }))
      .mockResolvedValueOnce(jsonResponse(published))
      .mockResolvedValueOnce(jsonResponse([
        { ...draft, status: 'Published', version: 8 },
      ]));
    vi.stubGlobal('fetch', fetchMock);
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Publish quest' }));
    expect(screen.getByRole('heading', { name: 'Publish this quest?' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Publish quest' }).at(-1)!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/auth/csrf-token');
    expect(fetchMock.mock.calls[2]?.[0]).toBe(`/api/v1/organizer/quests/${draft.id}/publish`);
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({ version: 7 });
    expect(await screen.findByText('Quest published successfully.')).toBeInTheDocument();
  });

  it('keeps a failed lifecycle dialog open and displays the backend detail', async () => {
    const user = userEvent.setup();
    const published = managedQuestListItem('Published');
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse([published]))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-cancel' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Active participants must be acknowledged.' }, 400)));
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Cancel quest' }));
    await user.click(screen.getAllByRole('button', { name: 'Cancel quest' }).at(-1)!);
    expect(await screen.findByText('Active participants must be acknowledged.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cancel this quest?' })).toBeInTheDocument();
  });

  it('confirms Draft deletion and never offers delete for a non-Draft row', async () => {
    const user = userEvent.setup();
    const draft = managedQuestListItem();
    const published = managedQuestListItem('Published', {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Published quest',
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([draft, published]))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-delete' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse([published]));
    vi.stubGlobal('fetch', fetchMock);
    renderList();

    const deleteTrigger = await screen.findByRole('button', { name: 'Delete draft' });
    expect(screen.getAllByRole('button', { name: 'Delete draft' })).toHaveLength(1);
    await user.click(deleteTrigger);
    expect(screen.getByRole('heading', { name: 'Delete this draft?' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Delete draft' }).at(-1)!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls[2]?.[0]).toBe(`/api/v1/organizer/quests/${draft.id}`);
    expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('DELETE');
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({ version: 7 });
    expect(await screen.findByText('Draft deleted.')).toBeInTheDocument();
  });

  it('moves dialog focus to the safe action and returns it to the invoking button', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse([managedQuestListItem()]),
    ));
    renderList();

    const trigger = await screen.findByRole('button', { name: 'Publish quest' });
    await user.click(trigger);
    const safeAction = screen.getByRole('button', { name: 'Keep quest' });
    expect(safeAction).toHaveFocus();
    await user.click(safeAction);
    expect(trigger).toHaveFocus();
  });
});

function renderList() {
  return renderWithRouter([
    { path: '/organizer/quests', element: <OrganizerQuestListPage /> },
    { path: '/organizer/quests/:questId/edit', element: <p>Edit destination</p> },
    { path: '/login', element: <p>Login destination</p> },
  ], '/organizer/quests');
}
