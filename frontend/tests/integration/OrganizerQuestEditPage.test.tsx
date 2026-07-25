import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { completionCodeKeys } from '../../src/hooks/useCompletion';
import { organizerQuestKeys } from '../../src/hooks/useOrganizerQuests';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import OrganizerQuestEditPage from '../../src/pages/OrganizerQuestEditPage';
import {
  QUEST_ID,
  REGION_ID,
  createTestQueryClient,
  jsonResponse,
  managedQuestDetail,
  renderWithRouter,
} from '../organizerTestUtils';

describe('Organizer Quest edit page', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('populates the form including cover, dates, and a preserved non-local Region', () => {
    const quest = managedQuestDetail();
    renderEdit(quest);

    expect(screen.getByLabelText('Title')).toHaveValue(quest.title);
    expect(screen.getByLabelText('Cover image URL')).toHaveValue(quest.coverImage.imageUrl);
    expect(screen.getByLabelText('Cover alt text')).toHaveValue(quest.coverImage.altText);
    expect(screen.getByLabelText('Region')).toHaveValue(REGION_ID);
    expect(screen.getByRole('option', { name: 'Auckland (current)' })).toBeInTheDocument();

    const localDate = new Date(quest.startAtUtc!);
    const pad = (part: number) => String(part).padStart(2, '0');
    const expected = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}`
      + `-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
    expect(screen.getByLabelText('Starts')).toHaveValue(expected);
  });

  it('submits a full PUT with the current version, cover, and preserved Region id', async () => {
    const user = userEvent.setup();
    const quest = managedQuestDetail();
    const updated = managedQuestDetail({ title: 'Updated harbour quest', version: 8 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-update' }))
      .mockResolvedValueOnce(jsonResponse(updated));
    vi.stubGlobal('fetch', fetchMock);
    renderEdit(quest);

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), updated.title);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Quest changes saved.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`/api/v1/organizer/quests/${QUEST_ID}`);
    const submitted = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(submitted.version).toBe(7);
    expect(submitted.locationRegionId).toBe(REGION_ID);
    expect(submitted.coverImage).toEqual({
      imageUrl: quest.coverImage.imageUrl,
      altText: quest.coverImage.altText,
      creatorName: quest.coverImage.creatorName,
      sourceUrl: quest.coverImage.sourceUrl,
      licenceNote: quest.coverImage.licenceNote,
    });
    expect(submitted).not.toHaveProperty('status');
    expect(submitted).not.toHaveProperty('xpAward');
  });

  it('shows a 409 conflict without retrying or replacing unsaved input until reload', async () => {
    const user = userEvent.setup();
    const quest = managedQuestDetail();
    const latest = managedQuestDetail({ title: 'Server title', version: 8 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-update' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'The quest has changed.' }, 409))
      .mockResolvedValueOnce(jsonResponse(latest));
    vi.stubGlobal('fetch', fetchMock);
    renderEdit(quest);

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'My unsaved title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { name: 'A newer version is available' })).toBeInTheDocument();
    expect(screen.getByText('The quest has changed.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('My unsaved title');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByLabelText('Title')).toHaveValue('My unsaved title');
  });

  it('reloads the latest server version only when explicitly requested after conflict', async () => {
    const user = userEvent.setup();
    const quest = managedQuestDetail();
    const latest = managedQuestDetail({ title: 'Latest server title', version: 8 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-update' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'The quest has changed.' }, 409))
      .mockResolvedValueOnce(jsonResponse(latest));
    vi.stubGlobal('fetch', fetchMock);
    renderEdit(quest);

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'My unsaved title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('The quest has changed.');
    await user.click(screen.getByRole('button', { name: 'Reload latest version' }));

    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Latest server title'));
    expect(fetchMock.mock.calls[2]?.[0]).toBe(`/api/v1/organizer/quests/${QUEST_ID}`);
  });

  it('renders Archived quests as read-only history with no mutations', () => {
    renderEdit(managedQuestDetail({ status: 'Archived' }));
    expect(screen.getByText(/read-only management history/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Publish|Cancel|Archive|Delete/ })).not.toBeInTheDocument();
  });
});

function renderEdit(quest: ReturnType<typeof managedQuestDetail>) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(organizerQuestKeys.detail(quest.id), quest);
  queryClient.setQueryData(['regions', ''], []);
  // The edit page now embeds the Completion Code section; seed its status so
  // these tests exercise the same fetch sequences as before Slice 4B-2.
  queryClient.setQueryData(completionCodeKeys.status(quest.id), {
    isConfigured: false,
    validFromUtc: null,
    validToUtc: null,
    createdAtUtc: null,
  });
  return renderWithRouter([
    { path: '/organizer/quests/:questId/edit', element: <OrganizerQuestEditPage /> },
    { path: '/organizer/quests', element: <p>List destination</p> },
    { path: '/login', element: <p>Login destination</p> },
  ], `/organizer/quests/${quest.id}/edit`, queryClient);
}
