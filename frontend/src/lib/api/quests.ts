import { apiFetch } from './apiFetch';
import { validateQuestsPage, validateQuestDetail, validateQuestImages } from '../validation/questDto';
import type { PagedResponse, QuestDetailDto, QuestImageDto, QuestListItemDto } from '../../types/quest';

export interface QuestFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  sourceType?: string;
  difficulty?: string;
  regionId?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
}

export async function fetchPublishedQuests(filters: QuestFilters = {}): Promise<PagedResponse<QuestListItemDto>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.category) params.set('category', filters.category);
  if (filters.sourceType) params.set('sourceType', filters.sourceType);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.regionId) params.set('regionId', filters.regionId);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortDirection) params.set('sortDirection', filters.sortDirection);

  const qs = params.toString();
  const url = `/v1/quests${qs ? `?${qs}` : ''}`;

  const payload = await apiFetch<unknown>(url);
  return validateQuestsPage(payload);
}

export async function fetchPublishedQuest(id: string): Promise<QuestDetailDto> {
  const url = `/v1/quests/${encodeURIComponent(id)}`;
  const payload = await apiFetch<unknown>(url);
  return validateQuestDetail(payload);
}

export async function fetchQuestImages(id: string): Promise<QuestImageDto[]> {
  const url = `/v1/quests/${encodeURIComponent(id)}/images`;
  const payload = await apiFetch<unknown>(url);
  return validateQuestImages(payload);
}
