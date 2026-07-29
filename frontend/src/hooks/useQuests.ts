import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchPublishedQuests, fetchPublishedQuest, fetchQuestImages } from '../lib/api/quests';
import type { QuestFilters } from '../lib/api/quests';
import type { PagedResponse, QuestDetailDto, QuestImageDto, QuestListItemDto } from '../types/quest';

export function useQuestList(filters: QuestFilters = {}, enabled = true) {
  return useQuery<PagedResponse<QuestListItemDto>>({
    queryKey: ['quests', filters],
    queryFn: () => fetchPublishedQuests(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 min
  });
}

export function useQuestDetail(id: string) {
  return useQuery<QuestDetailDto>({
    queryKey: ['quest', id],
    queryFn: () => fetchPublishedQuest(id),
    enabled: !!id,
  });
}

export function useQuestImages(id: string) {
  return useQuery<QuestImageDto[]>({
    queryKey: ['quest-images', id],
    queryFn: () => fetchQuestImages(id),
    enabled: !!id,
  });
}
