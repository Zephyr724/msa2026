import type {
  CreateQuestInput,
  QuestManagementDetailDto,
  QuestManagementListItemDto,
  UpdateQuestInput,
} from '../../types/questManagement';
import {
  validateQuestManagementDetail,
  validateQuestManagementList,
} from '../validation/questManagementDto';
import { apiFetch } from './apiFetch';

const QUESTS_PATH = '/v1/organizer/quests';

function questPath(id: string) {
  return `${QUESTS_PATH}/${encodeURIComponent(id)}`;
}

export async function fetchOrganizerQuests(signal?: AbortSignal): Promise<QuestManagementListItemDto[]> {
  return validateQuestManagementList(await apiFetch<unknown>(QUESTS_PATH, { signal }));
}

export async function createOrganizerQuest(
  input: CreateQuestInput,
  signal?: AbortSignal,
): Promise<QuestManagementDetailDto> {
  const payload = await apiFetch<unknown>(QUESTS_PATH, {
    method: 'POST',
    body: JSON.stringify(input),
    signal,
  });
  return validateQuestManagementDetail(payload);
}

export async function fetchOrganizerQuest(
  id: string,
  signal?: AbortSignal,
): Promise<QuestManagementDetailDto> {
  return validateQuestManagementDetail(await apiFetch<unknown>(questPath(id), { signal }));
}

export async function updateOrganizerQuest(
  id: string,
  input: UpdateQuestInput,
  signal?: AbortSignal,
): Promise<QuestManagementDetailDto> {
  const payload = await apiFetch<unknown>(questPath(id), {
    method: 'PUT',
    body: JSON.stringify(input),
    signal,
  });
  return validateQuestManagementDetail(payload);
}

export async function deleteOrganizerQuest(
  id: string,
  version: number,
  signal?: AbortSignal,
): Promise<void> {
  await apiFetch<void>(questPath(id), {
    method: 'DELETE',
    body: JSON.stringify({ version }),
    signal,
  });
}

async function changeQuestStatus(
  id: string,
  action: 'publish' | 'cancel' | 'archive',
  body: { version: number; confirmActiveParticipants?: boolean },
  signal?: AbortSignal,
) {
  const payload = await apiFetch<unknown>(`${questPath(id)}/${action}`, {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
  return validateQuestManagementDetail(payload);
}

export function publishOrganizerQuest(id: string, version: number, signal?: AbortSignal) {
  return changeQuestStatus(id, 'publish', { version }, signal);
}

export function cancelOrganizerQuest(
  id: string,
  version: number,
  confirmActiveParticipants: boolean,
  signal?: AbortSignal,
) {
  return changeQuestStatus(id, 'cancel', { version, confirmActiveParticipants }, signal);
}

export function archiveOrganizerQuest(id: string, version: number, signal?: AbortSignal) {
  return changeQuestStatus(id, 'archive', { version }, signal);
}
