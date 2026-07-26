export interface LeaderboardRow {
  rank: number;
  displayName: string;
  totalXp: number;
  verifiedCompletionCount: number;
}

export interface PeopleLeaderboard {
  scope: 'nz';
  period: 'allTime';
  rows: LeaderboardRow[];
}
