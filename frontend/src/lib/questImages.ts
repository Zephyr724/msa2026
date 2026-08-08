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

function pexelsPhoto(photoId: number): string {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg`;
}

// These titles still use project-owned SVG covers in the seed data. Give each
// one a topic-specific photo instead of showing the same category photo across
// Discover. Pexels labels these photos free to use (checked 2026-08-08); most
// are also credited in the assessment seed catalogue.
const QUEST_TITLE_PHOTOS: Readonly<Record<string, string>> = {
  'Community Stream Cleanup': pexelsPhoto(9037222),
  'Native Tree Planting Day': pexelsPhoto(7656721),
  'Recycling Workshop': pexelsPhoto(6591163),
  'Kiwi Bird Habitat Protection': pexelsPhoto(33261712),
  'Water Quality Monitoring': pexelsPhoto(10822517),
  'School Environmental Education': pexelsPhoto(36713464),
  'Coastal Cleanup Challenge': pexelsPhoto(36713477),
  'Māngere Bike Path Planting': pexelsPhoto(5029853),
  'Manurewa Community Garden': pexelsPhoto(5029923),
  'Tāmaki Wetland Restoration': pexelsPhoto(17226557),
  'Auckland Citywide Bird Count': pexelsPhoto(2954927),
  'Backyard Biodiversity Challenge': pexelsPhoto(37094095),
  'Ōtara Youth Eco Club': pexelsPhoto(36729400),
  'Papakura Waste Audit': pexelsPhoto(6591422),
  'Mt Roskill Stream Planting': pexelsPhoto(7656745),
  'Tūpuna Maunga Community Planting — Maungarei': pexelsPhoto(5029853),
  'Waimakariri Off-road Clean-up 2026': pexelsPhoto(9037222),
  'Sanctuary Wetland Community Planting': pexelsPhoto(28662953),
  'Friends of Nepal Reserve Working Bee': pexelsPhoto(17226557),
  'DOC Hihi Field Assistant — Tiritiri Matangi': pexelsPhoto(32881359),
  'Auckland Learn to Compost Workshops': pexelsPhoto(9475362),
  'Wellington Backyard Biodiversity': pexelsPhoto(37094095),
  'Tauranga Environmental Volunteering': pexelsPhoto(33406827),
  'Sustainable Coastlines Community Clean-ups': pexelsPhoto(4712004),
  'Find Your Conservation Crew': pexelsPhoto(12319269),
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
  const titlePhoto = QUEST_TITLE_PHOTOS[title];
  const candidates = [
    source && !isRepositoryQuestPlaceholder(source) ? source : null,
    titlePhoto
      ? `${titlePhoto}?auto=compress&cs=tinysrgb&fit=crop&w=${safeWidth}&h=${safeHeight}`
      : null,
    `${FIGMA_ECO_PHOTOS[category]}?auto=format&fit=crop&crop=center&q=78&w=${safeWidth}&h=${safeHeight}`,
    `https://picsum.photos/seed/${placeholderSeed(title, category)}/${safeWidth}/${safeHeight}`,
    QUEST_IMAGE_FALLBACK,
  ].filter((candidate): candidate is string => Boolean(candidate));

  return [...new Set(candidates)];
}
