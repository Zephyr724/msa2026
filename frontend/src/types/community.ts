import type { RegionSummaryDto } from './region';

export interface MyProfile {
  displayName: string;
  homeCommunity: RegionSummaryDto | null;
  showCommunityOnPassport: boolean;
  communityChangeAvailableAtUtc: string | null;
}

export interface WeeklyStreak {
  currentWeeks: number;
  hasVerifiedImpactThisWeek: boolean;
}

export interface CommunityChallenge {
  id: string;
  localArea: RegionSummaryDto;
  periodStartUtc: string;
  periodEndUtc: string;
  targetType: 'VerifiedCompletionCount';
  targetValue: number;
  rewardAchievementId: string | null;
  status: 'Active' | 'Completed' | 'Failed' | 'Cancelled';
  currentProgress: number;
  progressPercentage: number;
  isPrivacyProtected: boolean;
  activeContributors: number | null;
  version: number;
}

export interface CommunityChallengeInput {
  localAreaRegionId: string;
  periodStartUtc: string;
  periodEndUtc: string;
  targetValue: number;
  rewardAchievementId: string | null;
  version?: number;
}
