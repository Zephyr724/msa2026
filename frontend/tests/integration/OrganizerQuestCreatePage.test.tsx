import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import OrganizerQuestCreatePage from '../../src/pages/OrganizerQuestCreatePage';
import {
  jsonResponse,
  managedQuestDetail,
  renderWithRouter,
} from '../organizerTestUtils';

describe('Organizer Quest create page', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('shows field-level client validation without making a write request', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    renderCreate();

    await user.click(screen.getByRole('button', { name: 'Create draft' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title.');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a description.');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a cover image URL.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('submits the exact create shape through CSRF and navigates to edit on success', async () => {
    const user = userEvent.setup();
    const created = managedQuestDetail();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-create' }))
      .mockResolvedValueOnce(jsonResponse(created, 201));
    vi.stubGlobal('fetch', fetchMock);
    renderCreate();

    await user.type(screen.getByLabelText('Title'), created.title);
    await user.type(screen.getByLabelText('Description'), created.description);
    await user.type(screen.getByLabelText('Cover image URL'), created.coverImage.imageUrl);
    await user.type(screen.getByLabelText('Cover alt text'), created.coverImage.altText);
    await user.type(screen.getByLabelText('Creator name'), '  Kiwimpact team  ');
    await user.type(screen.getByLabelText('Image source URL'), created.coverImage.sourceUrl!);
    await user.type(screen.getByLabelText('Licence note'), created.coverImage.licenceNote!);
    await user.click(screen.getByRole('button', { name: 'Create draft' }));

    await waitFor(() => expect(screen.getByText('Edit destination')).toBeInTheDocument());
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/auth/csrf-token');
    expect(fetchMock.mock.calls[2]?.[0]).toBe('/api/v1/organizer/quests');
    const submitted = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body));
    expect(submitted).toEqual({
      title: created.title,
      description: created.description,
      category: 'RestoreNature',
      registrationMode: 'Native',
      difficulty: 'Easy',
      capacity: null,
      startAtUtc: null,
      endAtUtc: null,
      locationRegionId: null,
      locationDescription: null,
      latitude: null,
      longitude: null,
      externalSourceUrl: null,
      coverImage: {
        imageUrl: created.coverImage.imageUrl,
        altText: created.coverImage.altText,
        creatorName: 'Kiwimpact team',
        sourceUrl: created.coverImage.sourceUrl,
        licenceNote: created.coverImage.licenceNote,
      },
    });
  });

  it('shows backend validation detail in the form summary', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-create' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'The selected Region is inactive.' }, 400)));
    renderCreate();
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The selected Region is inactive.');
  });

  it('redirects an expired write session without the dirty-form blocker', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ token: 'csrf-create' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Session expired.' }, 401)));
    renderCreate();
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create draft' }));

    expect(await screen.findByText('Login destination')).toBeInTheDocument();
    expect(screen.queryByText('You have unsaved changes.')).not.toBeInTheDocument();
  });
});

function renderCreate() {
  return renderWithRouter([
    { path: '/organizer/quests/new', element: <OrganizerQuestCreatePage /> },
    { path: '/organizer/quests/:questId/edit', element: <p>Edit destination</p> },
    { path: '/organizer/quests', element: <p>List destination</p> },
    { path: '/login', element: <p>Login destination</p> },
  ], '/organizer/quests/new');
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Title'), 'A valid quest');
  await user.type(screen.getByLabelText('Description'), 'A useful description');
  await user.type(screen.getByLabelText('Cover image URL'), '/images/quest.jpg');
  await user.type(screen.getByLabelText('Cover alt text'), 'Volunteers at work');
}
