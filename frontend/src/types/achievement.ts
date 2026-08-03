// ── Slice 6A achievement read contract ────────────────────────────
// Exact frontend mirrors of the DTOs documented in
// specs/architecture/03-api-contract.md §2.12. Codes and categories remain
// open strings so future catalog entries render through the client fallback.

export interface AchievementCatalogItem {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
}

export interface EarnedAchievement {
  achievementId: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  awardedAt: string;
}

export const ACHIEVEMENT_RARITIES = [
  'Unawarded',
  'UltraRare',
  'Rare',
  'Uncommon',
  'Common',
] as const;

export type AchievementRarity = (typeof ACHIEVEMENT_RARITIES)[number];

export const ACHIEVEMENT_TROPHY_TIERS = [
  'Locked',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
] as const;

export type AchievementTrophyTier =
  (typeof ACHIEVEMENT_TROPHY_TIERS)[number];

export interface AchievementNationwideStat {
  achievementId: string;
  nationwideEarnedCount: number;
  nationwideMemberCount: number;
  earnedPercentage: number;
  rarity: AchievementRarity;
  calculatedAtUtc: string;
}

export interface AchievementCosmetics {
  passportBorderStyle: string | null;
  avatarFrameStyle: string | null;
  badgeStampStyles: string[];
}

export interface AchievementTrophyProfile {
  tier: AchievementTrophyTier;
  requiredCount: number;
  nextTier: AchievementTrophyTier | null;
  nextRequiredCount: number | null;
  nationwideEarnedCount: number;
  nationwideMemberCount: number;
  earnedPercentage: number;
  rarity: AchievementRarity;
  calculatedAtUtc: string;
}

export interface AchievementProfile {
  earnedDistinctCount: number;
  activeAchievementCount: number;
  trophy: AchievementTrophyProfile;
  cosmetics: AchievementCosmetics;
}
