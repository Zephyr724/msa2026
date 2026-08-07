import type { AchievementRarity, AchievementTrophyTier } from './achievement.ts';

export interface PublicPassportSettings {
  isEnabled: boolean;
  shareId: string | null;
  featuredAchievementIds: string[];
}

export interface VerifiedStoryContext {
  completionId: string;
  questId: string;
  questTitle: string;
}

export interface PublicPassportAchievement {
  achievementId: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  nationwideEarnedCount: number;
  nationwideMemberCount: number;
  earnedPercentage: number;
  rarity: AchievementRarity;
}

export interface PublicPassportTrophy {
  tier: AchievementTrophyTier;
  nationwideEarnedCount: number;
  nationwideMemberCount: number;
  earnedPercentage: number;
  rarity: AchievementRarity;
}

export interface PublicPassportStory {
  postId: string;
  title: string;
  content: string;
  images: Array<{ imageUrl: string; imageAltText: string; sortOrder: number }>;
  tags: string[];
  questTitle: string;
  questCoverImageUrl: string | null;
  createdAtUtc: string;
}

export interface PublicPassport {
  displayName: string;
  verifiedXp: number;
  verifiedQuestCount: number;
  level: number;
  rankTitle: string;
  trophy: PublicPassportTrophy;
  featuredAchievements: PublicPassportAchievement[];
  verifiedStories: PublicPassportStory[];
}
