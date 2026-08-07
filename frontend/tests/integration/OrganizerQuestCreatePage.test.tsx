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

// The form must remain fully usable without Google Maps; pin the unconfigured
// fallback path so this test does not depend on local environment variables.
vi.mock('../../src/lib/googleMapsConfig', () => ({
  googleMapsConfig: {
    apiKey: null,
    mapId: null,
    isConfigured: false,
  },
}));

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

  it('renders the location section with manual coordinate entry when maps are unconfigured', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    renderCreate();

    // Without Google Maps configuration the place search stays hidden and the
    // accessible manual coordinate path remains immediately visible.
    expect(screen.getByText(/Place search and map are unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Search for a place' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Latitude')).toBeInTheDocument();
    expect(screen.getByLabelText('Longitude')).toBeInTheDocument();
    expect(screen.getByLabelText('Location description')).toBeInTheDocument();
  });

  it('labels and orders the location flow search-first, description second', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    renderCreate();

    // The primary control is "Search and confirm location"; the derived,
    // editable description follows it in document order.
    const searchControl = screen.getByText('Search and confirm location');
    const description = screen.getByLabelText('Location description');
    expect(
      searchControl.compareDocumentPosition(description)
        & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText(/Filled automatically when you choose a place/))
      .toBeInTheDocument();
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
