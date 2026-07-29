// ── Slice 5B Passport completion-history contract ─────────────────
// Exact frontend mirror of `PassportCompletionItemDto` and the existing
// `PagedResponse<T>` envelope (specs/implementation/05b-passport-lite.md §8).
// Verified + CompletionCode are the only implemented status and method; a
// future completion-method Slice broadens backend, DTO/validator, and UI
// labels together (m2).

import type { PagedResponse, QuestCategory, QuestCoverImageDto } from './quest.ts';
import type { RegionSummaryDto } from './region.ts';

export const PASSPORT_QUEST_STATUSES = [
  'Published',
  'Cancelled',
  'Archived',
] as const;

export type PassportQuestStatus = (typeof PASSPORT_QUEST_STATUSES)[number];

export interface PassportCompletionItem {
  completionId: string;
  questId: string;
  questTitle: string;
  questCategory: QuestCategory;
  questStatus: PassportQuestStatus;
  coverImage: QuestCoverImageDto | null;
  status: 'Pending' | 'Verified' | 'Rejected' | 'SelfReported';
  method: 'CompletionCode' | 'EvidenceClaim' | 'SelfReported';
  completedAtUtc: string;
  verifiedAtUtc: string | null;
  /** Null for an ordinary reward-pending row; never estimated client-side. */
  xpAmount: number | null;
  achievementNames: string[];
}

export type PassportCompletionsPage = PagedResponse<PassportCompletionItem>;

export interface PassportCategoryImpact {
  category: QuestCategory;
  verifiedCompletionCount: number;
  verifiedXp: number;
}

export interface PassportSummary {
  displayName: string;
  totalXp: number;
  level: number;
  rankTitle: string;
  homeCommunity: RegionSummaryDto | null;
  verifiedCompletionCount: number;
  selfReportedCompletionCount: number;
  pendingCompletionCount: number;
  categoryImpact: PassportCategoryImpact[];
}

export interface PassportCommunityParticipation {
  community: RegionSummaryDto;
  isCurrentCommunity: boolean;
  verifiedCompletionCount: number;
  verifiedXp: number;
  challengesContributedTo: number;
  challengeAchievementsEarned: number;
  latestContributionAtUtc: string;
}
