import type {
  MyQuestParticipationDto,
  QuestParticipationDto,
} from '../../types/participation';
import {
  validateMyQuestParticipation,
  validateQuestParticipation,
} from '../validation/participationDto';
import { apiFetch } from './apiFetch';

function questParticipationPath(questId: string): string {
  return `/v1/quests/${encodeURIComponent(questId)}`;
}

export async function fetchMyQuestParticipation(
  questId: string,
): Promise<MyQuestParticipationDto> {
  const payload = await apiFetch<unknown>(
    `${questParticipationPath(questId)}/participation`,
  );
  return validateMyQuestParticipation(payload);
}

export async function joinQuest(questId: string): Promise<QuestParticipationDto> {
  const payload = await apiFetch<unknown>(`${questParticipationPath(questId)}/join`, {
    method: 'POST',
  });
  return validateQuestParticipation(payload);
}

export async function cancelQuestParticipation(
  questId: string,
): Promise<QuestParticipationDto> {
  const payload = await apiFetch<unknown>(`${questParticipationPath(questId)}/cancel`, {
    method: 'POST',
  });
  return validateQuestParticipation(payload);
}
