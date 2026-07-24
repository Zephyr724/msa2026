import {
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_REGISTRATION_MODES,
  type QuestCategory,
  type QuestDifficulty,
  type QuestLocationRegionDto,
  type QuestRegistrationMode,
} from '../../types/quest';
import type { QuestManagementDetailDto } from '../../types/questManagement';

export interface QuestFormValues {
  title: string;
  description: string;
  category: QuestCategory;
  registrationMode: QuestRegistrationMode | '';
  difficulty: QuestDifficulty;
  capacity: string;
  unlimitedCapacity: boolean;
  startAtUtc: string;
  endAtUtc: string;
  locationRegionId: string;
  locationRegion: QuestLocationRegionDto | null;
  locationDescription: string;
  externalSourceUrl: string;
  coverImageUrl: string;
  coverAltText: string;
  coverCreatorName: string;
  coverSourceUrl: string;
  coverLicenceNote: string;
}

export const emptyQuestFormValues: QuestFormValues = {
  title: '',
  description: '',
  category: QUEST_CATEGORIES[0],
  registrationMode: QUEST_REGISTRATION_MODES[0],
  difficulty: QUEST_DIFFICULTIES[0],
  capacity: '',
  unlimitedCapacity: true,
  startAtUtc: '',
  endAtUtc: '',
  locationRegionId: '',
  locationRegion: null,
  locationDescription: '',
  externalSourceUrl: '',
  coverImageUrl: '',
  coverAltText: '',
  coverCreatorName: '',
  coverSourceUrl: '',
  coverLicenceNote: '',
};

export function questDetailToFormValues(
  quest: QuestManagementDetailDto,
): QuestFormValues {
  return {
    title: quest.title,
    description: quest.description,
    category: quest.category,
    registrationMode: quest.registrationMode ?? '',
    difficulty: quest.difficulty,
    capacity: quest.capacity === null ? '' : String(quest.capacity),
    unlimitedCapacity: quest.capacity === null,
    startAtUtc: isoUtcToLocalInput(quest.startAtUtc),
    endAtUtc: isoUtcToLocalInput(quest.endAtUtc),
    locationRegionId: quest.locationRegion?.id ?? '',
    locationRegion: quest.locationRegion,
    locationDescription: quest.locationDescription ?? '',
    externalSourceUrl: quest.externalSourceUrl ?? '',
    coverImageUrl: quest.coverImage.imageUrl,
    coverAltText: quest.coverImage.altText,
    coverCreatorName: quest.coverImage.creatorName ?? '',
    coverSourceUrl: quest.coverImage.sourceUrl ?? '',
    coverLicenceNote: quest.coverImage.licenceNote ?? '',
  };
}

function isoUtcToLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
