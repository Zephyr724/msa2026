import {
  Binoculars,
  Bird,
  BookOpen,
  Leaf,
  Recycle,
  Sprout,
  type LucideIcon,
} from 'lucide-react';
import type {
  QuestCategory,
  QuestDifficulty,
  QuestListItemDto,
  QuestRegistrationMode,
  QuestSourceType,
} from '../types/quest.ts';

interface CategoryPresentation {
  label: string;
  Icon: LucideIcon;
  tone: string;
  softTone: string;
}

export const CATEGORY_PRESENTATION: Record<QuestCategory, CategoryPresentation> = {
  RestoreNature: {
    label: 'Restore Nature',
    Icon: Leaf,
    tone: 'bg-emerald-600 text-white',
    softTone: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  ProtectWildlife: {
    label: 'Protect Wildlife',
    Icon: Bird,
    tone: 'bg-blue-600 text-white',
    softTone: 'border-sky-300 bg-sky-50 text-sky-800',
  },
  CleanReduceWaste: {
    label: 'Clean & Reduce Waste',
    Icon: Recycle,
    tone: 'bg-red-500 text-white',
    softTone: 'border-orange-300 bg-orange-50 text-orange-800',
  },
  GrowCompost: {
    label: 'Grow & Compost',
    Icon: Sprout,
    tone: 'bg-lime-600 text-white',
    softTone: 'border-lime-300 bg-lime-50 text-lime-800',
  },
  ObserveMeasure: {
    label: 'Observe & Measure',
    Icon: Binoculars,
    tone: 'bg-violet-600 text-white',
    softTone: 'border-violet-300 bg-violet-50 text-violet-800',
  },
  LearnShare: {
    label: 'Learn & Share',
    Icon: BookOpen,
    tone: 'bg-fuchsia-600 text-white',
    softTone: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800',
  },
};

export const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
};

export const DIFFICULTY_TONES: Record<QuestDifficulty, string> = {
  Easy: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  Medium: 'border-amber-300 bg-amber-50 text-amber-800',
  Hard: 'border-rose-300 bg-rose-50 text-rose-800',
};

export const SOURCE_LABELS: Record<QuestSourceType, string> = {
  OrganizerOwned: 'Organizer quest',
  AdminCuratedExternal: 'Official external event',
  PlatformEcoChallenge: 'Kiwimpact challenge',
};

export const SOURCE_TONES: Record<QuestSourceType, string> = {
  OrganizerOwned: 'border-base-300 bg-base-200 text-base-content/75',
  AdminCuratedExternal: 'border-violet-300 bg-violet-50 text-violet-800',
  PlatformEcoChallenge: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

export const REGISTRATION_LABELS: Record<QuestRegistrationMode, string> = {
  Native: 'Join on Kiwimpact',
  External: 'External registration',
  NoneRequired: 'No registration needed',
};

export const REGISTRATION_TONES: Record<QuestRegistrationMode, string> = {
  Native: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  External: 'border-violet-300 bg-violet-50 text-violet-800',
  NoneRequired: 'border-sky-300 bg-sky-50 text-sky-800',
};

export function questHighlightTone(label: string): string {
  if (label.toLowerCase().includes('almost full')) {
    return 'border-amber-300 bg-amber-50 text-amber-900';
  }
  if (label.toLowerCase().includes('recommend')) {
    return 'border-violet-300 bg-violet-50 text-violet-900';
  }
  if (label.toLowerCase().includes('first')) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900';
  }
  return 'border-emerald-300 bg-base-100/95 text-primary';
}

export function questDiscoveryHighlight(
  quest: Pick<QuestListItemDto, 'difficulty' | 'sourceType'>,
): string | undefined {
  if (quest.sourceType === 'PlatformEcoChallenge') {
    return 'Featured challenge';
  }
  if (quest.difficulty === 'Easy') {
    return 'Good first Quest';
  }
  return undefined;
}

export function questLocationTrail(
  region: import('../types/quest.ts').QuestLocationRegionDto | null,
): string[] {
  if (!region) return [];
  return [
    region.name,
    region.administrativeAreaName,
    region.countryName,
  ].filter((part, index, parts): part is string =>
    Boolean(part) && parts.indexOf(part) === index);
}

export function formatQuestDate(value: string | null): string {
  if (!value) return 'Schedule to be confirmed';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
