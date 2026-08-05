// ── Slice 4B Completion Code contract ─────────────────────────────
// Exact frontend mirror of the merged Slice 4B-1 backend DTOs
// (QuestCompletionContracts.cs). Do not model fields the backend does
// not expose: plaintext exists only on GeneratedCompletionCodeDto.

export const MY_COMPLETION_STATUSES = [
  'None', 'Pending', 'Verified', 'Rejected', 'SelfReported',
] as const;
export const COMPLETION_METHODS = [
  'CompletionCode', 'EvidenceClaim', 'SelfReported',
] as const;

export type MyCompletionStatus = (typeof MY_COMPLETION_STATUSES)[number];
export type CompletionMethod = (typeof COMPLETION_METHODS)[number];

// Canonical 32-symbol alphabet (excludes I, O, 0, 1); 10 characters.
export const NORMALIZED_COMPLETION_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{10}$/;
// Backend display format returned by generate/rotate: XXXXX-XXXXX.
export const DISPLAY_COMPLETION_CODE_PATTERN =
  /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

/** Reveal-once response. The plaintext code must stay out of every cache. */
export interface GeneratedCompletionCodeDto {
  code: string;
  validFromUtc: string;
  validToUtc: string | null;
}

/** Metadata-only organizer status. Never carries plaintext or hashes. */
export interface CompletionCodeStatusDto {
  isConfigured: boolean;
  validFromUtc: string | null;
  validToUtc: string | null;
  createdAtUtc: string | null;
}

/** Current-user completion state. Exactly four keys, never secret material. */
export interface MyQuestCompletionDto {
  status: MyCompletionStatus;
  method: CompletionMethod | null;
  completedAtUtc: string | null;
  verifiedAtUtc: string | null;
}

export interface CompletionRewardAchievementDto {
  achievementId: string;
  code: string;
  name: string;
}

export interface CompletionRewardDto {
  rewardEventId: string;
  xpAwarded: number;
  previousTotalXp: number;
  totalXp: number;
  previousLevel: number;
  level: number;
  previousRankTitle: string;
  rankTitle: string;
  unlockedAchievements: CompletionRewardAchievementDto[];
}

export interface RedeemCompletionResultDto {
  completion: MyQuestCompletionDto;
  reward: CompletionRewardDto;
}

export interface EvidenceClaimInput {
  description: string;
  evidenceUrl: string | null;
  userDeclaration: boolean;
  completedAtUtc: string;
}

export interface EvidenceClaimSummary {
  claimId: string;
  userId: string;
  questId: string;
  questTitle: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  completedAtUtc: string;
  createdAtUtc: string;
  reviewedAtUtc: string | null;
}

export interface EvidenceClaim extends EvidenceClaimSummary {
  description: string | null;
  evidenceUrl: string | null;
  userDeclaration: boolean;
  reviewNote: string | null;
  reviewedByUserId: string | null;
  evidencePurgedAtUtc: string | null;
}
