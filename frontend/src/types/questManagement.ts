import type {
  QuestCategory,
  QuestDifficulty,
  QuestLocationRegionDto,
  QuestRegistrationMode,
  QuestSourceType,
} from './quest';

export const QUEST_STATUSES = [
  'Draft',
  'Published',
  'Cancelled',
  'Archived',
] as const;

export const EXTERNAL_SOURCE_STATUSES = [
  'Current',
  'NeedsReview',
  'Changed',
  'SourceRemoved',
] as const;

export type QuestStatus = (typeof QUEST_STATUSES)[number];
export type ExternalSourceStatus = (typeof EXTERNAL_SOURCE_STATUSES)[number];

export interface CoverImageInput {
  imageUrl: string;
  altText: string;
  creatorName: string | null;
  sourceUrl: string | null;
  licenceNote: string | null;
}

export interface CreateQuestInput {
  title: string;
  description: string;
  category: QuestCategory;
  registrationMode: QuestRegistrationMode;
  difficulty: QuestDifficulty;
  capacity: number | null;
  startAtUtc: string | null;
  endAtUtc: string | null;
  locationRegionId: string | null;
  locationDescription: string | null;
  externalSourceUrl: string | null;
  coverImage: CoverImageInput;
}

export interface UpdateQuestInput extends Omit<CreateQuestInput, 'coverImage'> {
  coverImage?: CoverImageInput;
  version: number;
}

export interface QuestManagementListItemDto {
  id: string;
  title: string;
  status: QuestStatus;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  capacity: number | null;
  startAtUtc: string | null;
  endAtUtc: string | null;
  locationRegion: QuestLocationRegionDto | null;
  updatedAtUtc: string;
  version: number;
}

export interface QuestManagementCoverImageDto {
  id: string;
  imageUrl: string;
  altText: string;
  creatorName: string | null;
  sourceUrl: string | null;
  licenceNote: string | null;
}

export interface QuestManagementDetailDto {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  status: QuestStatus;
  sourceType: QuestSourceType;
  registrationMode: QuestRegistrationMode | null;
  difficulty: QuestDifficulty;
  xpAward: number;
  capacity: number | null;
  startAtUtc: string | null;
  endAtUtc: string | null;
  locationRegion: QuestLocationRegionDto | null;
  locationDescription: string | null;
  externalSourceUrl: string | null;
  externalSourceStatus: ExternalSourceStatus | null;
  sourceCheckedAtUtc: string | null;
  nextCheckDueAtUtc: string | null;
  coverImage: QuestManagementCoverImageDto;
  createdAtUtc: string;
  updatedAtUtc: string;
  version: number;
}
