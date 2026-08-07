import type {
  CompletionCodeStatusDto,
  EvidenceClaim,
  EvidenceClaimInput,
  EvidenceClaimSummary,
  GeneratedCompletionCodeDto,
  MyQuestCompletionDto,
  CompletionRewardDto,
  RewardEventInboxDto,
  RedeemCompletionResultDto,
} from '../../types/completion';
import {
  validateCompletionCodeStatus,
  validateGeneratedCompletionCode,
  validateMyQuestCompletion,
  validateRedeemCompletionResult,
  validateCompletionReward,
  validateRewardEventInbox,
} from '../validation/completionDto';
import { apiFetch } from './apiFetch';

function organizerCompletionCodesPath(questId: string): string {
  return `/v1/organizer/quests/${encodeURIComponent(questId)}/completion-codes`;
}

function questPath(questId: string): string {
  return `/v1/quests/${encodeURIComponent(questId)}`;
}

export async function fetchCompletionCodeStatus(
  questId: string,
  signal?: AbortSignal,
): Promise<CompletionCodeStatusDto> {
  const payload = await apiFetch<unknown>(organizerCompletionCodesPath(questId), { signal });
  return validateCompletionCodeStatus(payload);
}

/**
 * Reveal-once boundary: the plaintext response is returned through this
 * promise only. Callers must keep it in short-lived component memory and must
 * never place it in Query/Mutation caches, stores, storage, URLs, or logs.
 */
export async function generateOrRotateCompletionCode(
  questId: string,
  signal?: AbortSignal,
): Promise<GeneratedCompletionCodeDto> {
  const payload = await apiFetch<unknown>(organizerCompletionCodesPath(questId), {
    method: 'POST',
    signal,
  });
  return validateGeneratedCompletionCode(payload);
}

export async function fetchMyQuestCompletion(
  questId: string,
  signal?: AbortSignal,
): Promise<MyQuestCompletionDto> {
  const payload = await apiFetch<unknown>(`${questPath(questId)}/completion`, { signal });
  return validateMyQuestCompletion(payload);
}

export async function redeemCompletionCode(
  questId: string,
  code: string,
  signal?: AbortSignal,
): Promise<RedeemCompletionResultDto> {
  const payload = await apiFetch<unknown>(`${questPath(questId)}/redeem`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    signal,
  });
  return validateRedeemCompletionResult(payload);
}

export async function fetchQuestRewardResolution(
  questId: string,
  signal?: AbortSignal,
): Promise<CompletionRewardDto> {
  const payload = await apiFetch<unknown>(`${questPath(questId)}/reward-resolution`, { signal });
  return validateCompletionReward(payload);
}

export async function fetchUnseenRewardEvents(
  signal?: AbortSignal,
): Promise<RewardEventInboxDto> {
  const payload = await apiFetch<unknown>('/v1/users/me/reward-events/unseen?take=10', { signal });
  return validateRewardEventInbox(payload);
}

export async function markRewardEventSeen(
  rewardEventId: string,
  signal?: AbortSignal,
): Promise<CompletionRewardDto> {
  const payload = await apiFetch<unknown>(
    `/v1/users/me/reward-events/${encodeURIComponent(rewardEventId)}/seen`,
    { method: 'POST', signal },
  );
  return validateCompletionReward(payload);
}

export function submitEvidenceClaim(
  questId: string, input: EvidenceClaimInput, signal?: AbortSignal,
): Promise<EvidenceClaim> {
  return apiFetch<EvidenceClaim>(`${questPath(questId)}/claims`, {
    method: 'POST', body: JSON.stringify(input), signal,
  });
}

export function selfReportCompletion(
  questId: string, completedAtUtc: string, signal?: AbortSignal,
): Promise<MyQuestCompletionDto> {
  return apiFetch<MyQuestCompletionDto>(`${questPath(questId)}/self-report`, {
    method: 'POST', body: JSON.stringify({ completedAtUtc }), signal,
  });
}

export function fetchMyClaims(signal?: AbortSignal): Promise<EvidenceClaimSummary[]> {
  return apiFetch<EvidenceClaimSummary[]>('/v1/users/me/claims', { signal });
}

export function fetchPendingClaims(signal?: AbortSignal): Promise<EvidenceClaimSummary[]> {
  return apiFetch<EvidenceClaimSummary[]>('/v1/admin/claims', { signal });
}

export function fetchAdminClaim(claimId: string, signal?: AbortSignal): Promise<EvidenceClaim> {
  return apiFetch<EvidenceClaim>(`/v1/admin/claims/${encodeURIComponent(claimId)}`, { signal });
}

export function reviewEvidenceClaim(
  claimId: string, approve: boolean, reviewNote: string,
  signal?: AbortSignal,
): Promise<EvidenceClaim> {
  return apiFetch<EvidenceClaim>(
    `/v1/admin/claims/${encodeURIComponent(claimId)}/review`,
    { method: 'POST', body: JSON.stringify({ approve, reviewNote: reviewNote || null }), signal },
  );
}
