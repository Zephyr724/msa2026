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
    tone: 'border-[#2F8F5B] bg-[#2F8F5B] text-white',
    softTone: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  ProtectWildlife: {
    label: 'Protect Wildlife',
    Icon: Bird,
    tone: 'border-[#3C72C9] bg-[#3C72C9] text-white',
    softTone: 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  CleanReduceWaste: {
    label: 'Clean & Reduce Waste',
    Icon: Recycle,
    tone: 'border-[#C74444] bg-[#C74444] text-white',
    softTone: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  GrowCompost: {
    label: 'Grow & Compost',
    Icon: Sprout,
    tone: 'border-[#6C8F2F] bg-[#6C8F2F] text-white',
    softTone: 'border-lime-200 bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  },
  ObserveMeasure: {
    label: 'Observe & Measure',
    Icon: Binoculars,
    tone: 'border-[#6C63D9] bg-[#6C63D9] text-white',
    softTone: 'border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  LearnShare: {
    label: 'Learn & Share',
    Icon: BookOpen,
    tone: 'border-[#C963D9] bg-[#C963D9] text-white',
    softTone: 'border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  },
};

export const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
};

export const DIFFICULTY_TONES: Record<QuestDifficulty, string> = {
  Easy: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Hard: 'border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const SOURCE_LABELS: Record<QuestSourceType, string> = {
  OrganizerOwned: 'Organizer quest',
  AdminCuratedExternal: 'Official external event',
  PlatformEcoChallenge: 'Kiwimpact challenge',
};

export const SOURCE_TONES: Record<QuestSourceType, string> = {
  OrganizerOwned: 'border-base-300 bg-secondary text-muted-content',
  AdminCuratedExternal: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  PlatformEcoChallenge: 'border-emerald-200 bg-emerald-50 text-primary dark:border-primary/40 dark:bg-emerald-900/30',
};

export const REGISTRATION_LABELS: Record<QuestRegistrationMode, string> = {
  Native: 'Join on Kiwimpact',
  External: 'External registration',
  NoneRequired: 'No registration needed',
};

export const REGISTRATION_TONES: Record<QuestRegistrationMode, string> = {
  Native: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  External: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  NoneRequired: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400',
};

export function questHighlightTone(label: string): string {
  // Highlights originate from several workflow surfaces, so presentation is
  // selected from semantic wording instead of duplicating a second status enum.
  if (label.toLowerCase().includes('almost full')) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/70 dark:bg-amber-950/95 dark:text-amber-100';
  }
  if (label.toLowerCase().includes('recommend')) {
    return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/70 dark:bg-violet-950/95 dark:text-violet-100';
  }
  if (label.toLowerCase().includes('first')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-950/95 dark:text-emerald-100';
  }
  if (
    label.toLowerCase().includes('ready')
    || label.toLowerCase().includes('completion available')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/70 dark:bg-amber-950/95 dark:text-amber-100';
  }
  if (label.toLowerCase().includes('not verified')) {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/70 dark:bg-red-950/95 dark:text-red-100';
  }
  if (label.toLowerCase().includes('cancelled')) {
    return 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-500 dark:bg-zinc-950/95 dark:text-zinc-100';
  }
  return 'border-primary/30 bg-primary/10 text-primary dark:border-primary/70 dark:bg-emerald-950/95 dark:text-emerald-100';
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
  // A Country or Administrative Area may repeat an ancestor name; de-duplicate
  // while preserving the user-facing hierarchy order.
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
