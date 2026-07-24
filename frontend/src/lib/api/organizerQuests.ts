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

export async function fetchOrganizerQuests(): Promise<QuestManagementListItemDto[]> {
  return validateQuestManagementList(await apiFetch<unknown>(QUESTS_PATH));
}

export async function createOrganizerQuest(
  input: CreateQuestInput,
): Promise<QuestManagementDetailDto> {
  const payload = await apiFetch<unknown>(QUESTS_PATH, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return validateQuestManagementDetail(payload);
}

export async function fetchOrganizerQuest(
  id: string,
): Promise<QuestManagementDetailDto> {
  return validateQuestManagementDetail(await apiFetch<unknown>(questPath(id)));
}

export async function updateOrganizerQuest(
  id: string,
  input: UpdateQuestInput,
): Promise<QuestManagementDetailDto> {
  const payload = await apiFetch<unknown>(questPath(id), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return validateQuestManagementDetail(payload);
}

export async function deleteOrganizerQuest(id: string, version: number): Promise<void> {
  await apiFetch<void>(questPath(id), {
    method: 'DELETE',
    body: JSON.stringify({ version }),
  });
}

async function changeQuestStatus(
  id: string,
  action: 'publish' | 'cancel' | 'archive',
  body: { version: number; confirmActiveParticipants?: boolean },
) {
  const payload = await apiFetch<unknown>(`${questPath(id)}/${action}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return validateQuestManagementDetail(payload);
}

export function publishOrganizerQuest(id: string, version: number) {
  return changeQuestStatus(id, 'publish', { version });
}

export function cancelOrganizerQuest(
  id: string,
  version: number,
  confirmActiveParticipants: boolean,
) {
  return changeQuestStatus(id, 'cancel', { version, confirmActiveParticipants });
}

export function archiveOrganizerQuest(id: string, version: number) {
  return changeQuestStatus(id, 'archive', { version });
}
