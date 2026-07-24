import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import type {
  QuestManagementDetailDto,
  QuestManagementListItemDto,
  QuestStatus,
} from '../src/types/questManagement';

export const QUEST_ID = '11111111-1111-4111-8111-111111111111';
export const REGION_ID = '22222222-2222-4222-8222-222222222222';
export const COVER_ID = '33333333-3333-4333-8333-333333333333';

export function managedQuestDetail(
  overrides: Partial<QuestManagementDetailDto> = {},
): QuestManagementDetailDto {
  return {
    id: QUEST_ID,
    title: 'Harbour restoration day',
    description: 'Restore native habitat beside the harbour.',
    category: 'RestoreNature',
    status: 'Draft',
    sourceType: 'OrganizerOwned',
    registrationMode: 'Native',
    difficulty: 'Easy',
    xpAward: 0,
    capacity: 20,
    startAtUtc: '2026-08-01T08:30:00.000Z',
    endAtUtc: '2026-08-01T11:30:00.000Z',
    locationRegion: {
      id: REGION_ID,
      name: 'Auckland',
      type: 'AdministrativeArea',
    },
    locationDescription: 'Meet beside the eastern entrance.',
    externalSourceUrl: null,
    externalSourceStatus: null,
    sourceCheckedAtUtc: null,
    nextCheckDueAtUtc: null,
    coverImage: {
      id: COVER_ID,
      imageUrl: 'https://images.example.test/harbour.jpg',
      altText: 'Volunteers planting beside the harbour',
      creatorName: 'Kiwimpact team',
      sourceUrl: 'https://images.example.test/source',
      licenceNote: 'Used with permission',
    },
    createdAtUtc: '2026-07-20T01:00:00.000Z',
    updatedAtUtc: '2026-07-24T01:00:00.000Z',
    version: 7,
    ...overrides,
  };
}

export function managedQuestListItem(
  status: QuestStatus = 'Draft',
  overrides: Partial<QuestManagementListItemDto> = {},
): QuestManagementListItemDto {
  const detail = managedQuestDetail();
  return {
    id: detail.id,
    title: detail.title,
    status,
    category: detail.category,
    difficulty: detail.difficulty,
    capacity: detail.capacity,
    startAtUtc: detail.startAtUtc,
    endAtUtc: detail.endAtUtc,
    locationRegion: detail.locationRegion,
    updatedAtUtc: detail.updatedAtUtc,
    version: detail.version,
    ...overrides,
  };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithRouter(
  routes: RouteObject[],
  initialEntry: string,
  queryClient = createTestQueryClient(),
) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, queryClient, router };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
