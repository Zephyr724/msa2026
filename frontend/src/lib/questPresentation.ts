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
  QuestRegistrationMode,
  QuestSourceType,
} from '../types/quest.ts';

interface CategoryPresentation {
  label: string;
  Icon: LucideIcon;
  tone: string;
}

export const CATEGORY_PRESENTATION: Record<QuestCategory, CategoryPresentation> = {
  RestoreNature: {
    label: 'Restore Nature',
    Icon: Leaf,
    tone: 'bg-emerald-600 text-white',
  },
  ProtectWildlife: {
    label: 'Protect Wildlife',
    Icon: Bird,
    tone: 'bg-blue-600 text-white',
  },
  CleanReduceWaste: {
    label: 'Clean & Reduce Waste',
    Icon: Recycle,
    tone: 'bg-red-500 text-white',
  },
  GrowCompost: {
    label: 'Grow & Compost',
    Icon: Sprout,
    tone: 'bg-lime-600 text-white',
  },
  ObserveMeasure: {
    label: 'Observe & Measure',
    Icon: Binoculars,
    tone: 'bg-violet-600 text-white',
  },
  LearnShare: {
    label: 'Learn & Share',
    Icon: BookOpen,
    tone: 'bg-fuchsia-600 text-white',
  },
};

export const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
};

export const SOURCE_LABELS: Record<QuestSourceType, string> = {
  OrganizerOwned: 'Organizer quest',
  AdminCuratedExternal: 'Official external event',
  PlatformEcoChallenge: 'Kiwimpact challenge',
};

export const REGISTRATION_LABELS: Record<QuestRegistrationMode, string> = {
  Native: 'Join on Kiwimpact',
  External: 'External registration',
  NoneRequired: 'No registration needed',
};

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
