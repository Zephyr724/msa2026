import type { QuestCategory } from '../types/quest.ts';

export const QUEST_IMAGE_FALLBACK = '/images/quests/quest-fallback.svg';

const FIGMA_ECO_PHOTOS: Record<QuestCategory, string> = {
  RestoreNature:
    'https://images.unsplash.com/photo-1668010881202-7914b6d9a2e3',
  ProtectWildlife:
    'https://images.unsplash.com/photo-1632722973264-30112cefb7fb',
  CleanReduceWaste:
    'https://images.unsplash.com/photo-1616680214084-22670de1bc82',
  GrowCompost:
    'https://images.unsplash.com/photo-1764786076566-9e0bff25dbc0',
  ObserveMeasure:
    'https://images.unsplash.com/photo-1624123795368-2d6b47743fa9',
  LearnShare:
    'https://images.unsplash.com/photo-1555069855-e580a9adbf43',
};

export function isRepositoryQuestPlaceholder(
  imageUrl: string | null | undefined,
): boolean {
  return Boolean(
    imageUrl?.startsWith('/images/quests/')
      && imageUrl.endsWith('.svg'),
  );
}

function placeholderSeed(title: string, category: QuestCategory): string {
  const normalized = `${category}-${title}`
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return encodeURIComponent(normalized || category.toLowerCase());
}

export function buildQuestImageCandidates({
  category,
  height = 440,
  source,
  title,
  width = 800,
}: {
  category: QuestCategory;
  height?: number;
  source?: string | null;
  title: string;
  width?: number;
}): string[] {
  const safeWidth = Math.max(64, Math.round(width));
  const safeHeight = Math.max(64, Math.round(height));
  const candidates = [
    source && !isRepositoryQuestPlaceholder(source) ? source : null,
    `${FIGMA_ECO_PHOTOS[category]}?auto=format&fit=crop&crop=center&q=78&w=${safeWidth}&h=${safeHeight}`,
    `https://picsum.photos/seed/${placeholderSeed(title, category)}/${safeWidth}/${safeHeight}`,
    QUEST_IMAGE_FALLBACK,
  ].filter((candidate): candidate is string => Boolean(candidate));

  return [...new Set(candidates)];
}
