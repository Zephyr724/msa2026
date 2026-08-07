import {
  ACHIEVEMENT_RARITIES,
  ACHIEVEMENT_TROPHY_TIERS,
  type AchievementRarity,
  type AchievementTrophyTier,
} from '../../types/achievement.ts';
import type {
  PublicPassport,
  PublicPassportAchievement,
  PublicPassportSettings,
  PublicPassportStory,
  VerifiedStoryContext,
} from '../../types/publicPassport.ts';

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Invalid Public Passport response.');
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`Invalid Public Passport ${label}.`);
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : string(value, label);
}

function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error(`Invalid Public Passport ${label}.`);
  return value;
}

function integer(value: unknown, label: string): number {
  const result = number(value, label);
  if (!Number.isInteger(result)) throw new Error(`Invalid Public Passport ${label}.`);
  return result;
}

function rarity(value: unknown): AchievementRarity {
  if (typeof value !== 'string' || !ACHIEVEMENT_RARITIES.includes(value as AchievementRarity))
    throw new Error('Invalid Public Passport rarity.');
  return value as AchievementRarity;
}

function trophyTier(value: unknown): AchievementTrophyTier {
  if (typeof value !== 'string' || !ACHIEVEMENT_TROPHY_TIERS.includes(value as AchievementTrophyTier))
    throw new Error('Invalid Public Passport trophy tier.');
  return value as AchievementTrophyTier;
}

function achievement(value: unknown): PublicPassportAchievement {
  const item = record(value);
  return {
    achievementId: string(item.achievementId, 'achievement id'),
    name: string(item.name, 'achievement name'),
    description: string(item.description, 'achievement description'),
    iconUrl: nullableString(item.iconUrl, 'achievement icon'),
    category: string(item.category, 'achievement category'),
    nationwideEarnedCount: integer(item.nationwideEarnedCount, 'earned count'),
    nationwideMemberCount: integer(item.nationwideMemberCount, 'member count'),
    earnedPercentage: number(item.earnedPercentage, 'earned percentage'),
    rarity: rarity(item.rarity),
  };
}

function story(value: unknown): PublicPassportStory {
  const item = record(value);
  if (!Array.isArray(item.images) || !Array.isArray(item.tags))
    throw new Error('Invalid Public Passport story.');
  return {
    postId: string(item.postId, 'story id'),
    title: string(item.title, 'story title'),
    content: string(item.content, 'story content'),
    images: item.images.map((image) => {
      const value = record(image);
      return {
        imageUrl: string(value.imageUrl, 'story image URL'),
        imageAltText: string(value.imageAltText, 'story image description'),
        sortOrder: integer(value.sortOrder, 'story image order'),
      };
    }),
    tags: item.tags.map((tag) => string(tag, 'story tag')),
    questTitle: string(item.questTitle, 'story Quest'),
    questCoverImageUrl: nullableString(item.questCoverImageUrl, 'story Quest cover'),
    createdAtUtc: string(item.createdAtUtc, 'story timestamp'),
  };
}

export function validatePublicPassportSettings(value: unknown): PublicPassportSettings {
  const item = record(value);
  if (typeof item.isEnabled !== 'boolean' || !Array.isArray(item.featuredAchievementIds))
    throw new Error('Invalid Public Passport settings.');
  return {
    isEnabled: item.isEnabled,
    shareId: nullableString(item.shareId, 'share id'),
    featuredAchievementIds: item.featuredAchievementIds.map((id) => string(id, 'achievement id')),
  };
}

export function validateVerifiedStoryContext(value: unknown): VerifiedStoryContext {
  const item = record(value);
  return {
    completionId: string(item.completionId, 'completion id'),
    questId: string(item.questId, 'Quest id'),
    questTitle: string(item.questTitle, 'Quest title'),
  };
}

export function validatePublicPassport(value: unknown): PublicPassport {
  const item = record(value);
  const trophy = record(item.trophy);
  if (!Array.isArray(item.featuredAchievements) || !Array.isArray(item.verifiedStories))
    throw new Error('Invalid Public Passport response.');
  const featuredAchievements = item.featuredAchievements.map(achievement);
  if (featuredAchievements.length > 5)
    throw new Error('Invalid Public Passport featured achievements.');
  return {
    displayName: string(item.displayName, 'display name'),
    verifiedXp: integer(item.verifiedXp, 'verified XP'),
    verifiedQuestCount: integer(item.verifiedQuestCount, 'verified Quest count'),
    level: integer(item.level, 'level'),
    rankTitle: string(item.rankTitle, 'rank title'),
    trophy: {
      tier: trophyTier(trophy.tier),
      nationwideEarnedCount: integer(trophy.nationwideEarnedCount, 'trophy count'),
      nationwideMemberCount: integer(trophy.nationwideMemberCount, 'trophy member count'),
      earnedPercentage: number(trophy.earnedPercentage, 'trophy percentage'),
      rarity: rarity(trophy.rarity),
    },
    featuredAchievements,
    verifiedStories: item.verifiedStories.map(story),
  };
}
