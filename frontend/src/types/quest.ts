// ── Shared Enum Contract ───────────────────────────────────────────
// Backend canonical enum names (case-sensitive match with C# enums).
// These are the single source of truth for all frontend enum usage.

export const QUEST_CATEGORIES = [
  "RestoreNature",
  "ProtectWildlife",
  "CleanReduceWaste",
  "GrowCompost",
  "ObserveMeasure",
  "LearnShare",
] as const;

export const QUEST_SOURCE_TYPES = [
  "OrganizerOwned",
  "AdminCuratedExternal",
  "PlatformEcoChallenge",
] as const;

export const QUEST_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export const QUEST_REGISTRATION_MODES = [
  "Native",
  "External",
  "NoneRequired",
] as const;

// ── Exact string union types ────────────────────────────────────────

export type QuestCategory = (typeof QUEST_CATEGORIES)[number];
export type QuestSourceType = (typeof QUEST_SOURCE_TYPES)[number];
export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];
export type QuestRegistrationMode = (typeof QUEST_REGISTRATION_MODES)[number];

// ── DTO Interfaces ──────────────────────────────────────────────────

export interface QuestImageDto {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isCover: boolean;
  creatorName: string | null;
  sourceUrl: string | null;
  licenceNote: string | null;
}

export interface QuestCoverImageDto {
  id: string;
  imageUrl: string;
  altText: string;
}

export interface QuestLocationRegionDto {
  id: string;
  name: string;
  type: import("../types/region").RegionType;
}

export interface QuestListItemDto {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  sourceType: QuestSourceType;
  registrationMode: QuestRegistrationMode | null;
  difficulty: QuestDifficulty;
  xpAward: number;
  capacity: number | null;
  startAtUtc: string | null;
  endAtUtc: string | null;
  locationRegion: QuestLocationRegionDto | null;
  locationDescription: string | null;
  coverImage: QuestCoverImageDto | null;
  latitude: number | null;
  longitude: number | null;
}

export interface QuestDetailDto extends QuestListItemDto {
  externalSourceUrl: string | null;
  sourceCheckedAt: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
