import { describe, expect, it } from 'vitest';
import {
  validatePublicPassport,
  validatePublicPassportSettings,
} from '../../src/lib/validation/publicPassportDto.ts';

describe('Public Passport DTO validation', () => {
  it('accepts the public allowlist without identity or community fields', () => {
    const result = validatePublicPassport({
      displayName: 'Aroha',
      verifiedXp: 250,
      verifiedQuestCount: 4,
      level: 3,
      rankTitle: 'Novice',
      trophy: {
        tier: 'Bronze',
        nationwideEarnedCount: 2,
        nationwideMemberCount: 100,
        earnedPercentage: 2,
        rarity: 'Rare',
      },
      featuredAchievements: [],
      verifiedStories: [],
    });

    expect(result.displayName).toBe('Aroha');
    expect(result).not.toHaveProperty('homeCommunity');
    expect(result).not.toHaveProperty('userId');
  });

  it('rejects more than five featured achievements', () => {
    const achievement = {
      achievementId: 'achievement-id',
      name: 'First Step',
      description: 'Complete a Quest.',
      iconUrl: null,
      category: 'Milestone',
      nationwideEarnedCount: 1,
      nationwideMemberCount: 100,
      earnedPercentage: 1,
      rarity: 'UltraRare',
    };
    expect(() => validatePublicPassport({
      displayName: 'Aroha',
      verifiedXp: 0,
      verifiedQuestCount: 0,
      level: 1,
      rankTitle: 'Novice',
      trophy: {
        tier: 'Locked',
        nationwideEarnedCount: 0,
        nationwideMemberCount: 100,
        earnedPercentage: 0,
        rarity: 'Unawarded',
      },
      featuredAchievements: Array.from({ length: 6 }, (_, index) => ({
        ...achievement,
        achievementId: `achievement-${index}`,
      })),
      verifiedStories: [],
    })).toThrow(/featured achievements/i);
  });

  it('requires explicit private-by-default settings fields', () => {
    expect(validatePublicPassportSettings({
      isEnabled: false,
      shareId: null,
      featuredAchievementIds: [],
    })).toEqual({ isEnabled: false, shareId: null, featuredAchievementIds: [] });
    expect(() => validatePublicPassportSettings({ shareId: null, featuredAchievementIds: [] }))
      .toThrow(/settings/i);
  });
});
