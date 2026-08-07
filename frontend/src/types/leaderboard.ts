export type PeopleLeaderboardScope = 'myCommunity' | 'auckland' | 'nz';
export type PeopleLeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';
export type CommunitiesLeaderboardScope = 'auckland' | 'nz';
export type CommunitiesLeaderboardPeriod = 'monthly' | 'allTime';

export interface LeaderboardRow {
  rank: number;
  displayName: string;
  totalXp: number;
  verifiedCompletionCount: number;
  isCurrentUser: boolean;
}

export interface CurrentUserLeaderboardPosition {
  rank: number;
  activeMemberCount: number;
  totalXp: number;
  verifiedCompletionCount: number;
  surpassedMemberCount: number;
  percentile: number;
  hasReachedScopeUpgradeThreshold: boolean;
}

export interface PeopleLeaderboard {
  scope: PeopleLeaderboardScope;
  period: PeopleLeaderboardPeriod;
  page: number;
  pageSize: number;
  totalCount: number;
  isPrivacyProtected: boolean;
  collectiveProgress: {
    totalXp: number;
    verifiedCompletionCount: number;
  } | null;
  currentUser: CurrentUserLeaderboardPosition | null;
  rows: LeaderboardRow[];
}

export interface CommunityLeaderboardRow {
  rank: number;
  regionId: string;
  regionName: string;
  verifiedCompletionCount: number;
  activeContributors: number | null;
  completionsPerContributor: number | null;
  isPrivacyProtected: boolean;
}

export interface CommunitiesLeaderboard {
  scope: CommunitiesLeaderboardScope;
  period: CommunitiesLeaderboardPeriod;
  rows: CommunityLeaderboardRow[];
}
