import type {
  MyQuestParticipationDto,
  MyQuestParticipationFilter,
  MyQuestParticipationListItemDto,
  QuestParticipationDto,
} from '../../types/participation';
import {
  validateMyQuestParticipation,
  validateMyQuestParticipationList,
  validateQuestParticipation,
} from '../validation/participationDto';
import { apiFetch } from './apiFetch';

function questParticipationPath(questId: string): string {
  return `/v1/quests/${encodeURIComponent(questId)}`;
}

export async function fetchMyQuestParticipation(
  questId: string,
  signal?: AbortSignal,
): Promise<MyQuestParticipationDto> {
  const payload = await apiFetch<unknown>(
    `${questParticipationPath(questId)}/participation`, { signal },
  );
  return validateMyQuestParticipation(payload);
}

export async function joinQuest(
  questId: string,
  signal?: AbortSignal,
): Promise<QuestParticipationDto> {
  const payload = await apiFetch<unknown>(`${questParticipationPath(questId)}/join`, {
    method: 'POST',
    signal,
  });
  return validateQuestParticipation(payload);
}

export async function cancelQuestParticipation(
  questId: string,
  signal?: AbortSignal,
): Promise<QuestParticipationDto> {
  const payload = await apiFetch<unknown>(`${questParticipationPath(questId)}/cancel`, {
    method: 'POST',
    signal,
  });
  return validateQuestParticipation(payload);
}

export async function fetchMyQuestParticipations(
  status: MyQuestParticipationFilter = 'all',
  signal?: AbortSignal,
): Promise<MyQuestParticipationListItemDto[]> {
  const params = new URLSearchParams({ status });
  const payload = await apiFetch<unknown>(
    `/v1/users/me/participations?${params.toString()}`, { signal },
  );
  return validateMyQuestParticipationList(payload);
}
