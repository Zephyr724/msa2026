import type {
  CompletionCodeStatusDto,
  EvidenceClaim,
  EvidenceClaimInput,
  EvidenceClaimSummary,
  GeneratedCompletionCodeDto,
  MyQuestCompletionDto,
} from '../../types/completion';
import {
  validateCompletionCodeStatus,
  validateGeneratedCompletionCode,
  validateMyQuestCompletion,
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
): Promise<CompletionCodeStatusDto> {
  const payload = await apiFetch<unknown>(organizerCompletionCodesPath(questId));
  return validateCompletionCodeStatus(payload);
}

/**
 * Reveal-once boundary: the plaintext response is returned through this
 * promise only. Callers must keep it in short-lived component memory and must
 * never place it in Query/Mutation caches, stores, storage, URLs, or logs.
 */
export async function generateOrRotateCompletionCode(
  questId: string,
): Promise<GeneratedCompletionCodeDto> {
  const payload = await apiFetch<unknown>(organizerCompletionCodesPath(questId), {
    method: 'POST',
  });
  return validateGeneratedCompletionCode(payload);
}

export async function fetchMyQuestCompletion(
  questId: string,
): Promise<MyQuestCompletionDto> {
  const payload = await apiFetch<unknown>(`${questPath(questId)}/completion`);
  return validateMyQuestCompletion(payload);
}

export async function redeemCompletionCode(
  questId: string,
  code: string,
): Promise<MyQuestCompletionDto> {
  const payload = await apiFetch<unknown>(`${questPath(questId)}/redeem`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return validateMyQuestCompletion(payload);
}

export function submitEvidenceClaim(
  questId: string, input: EvidenceClaimInput,
): Promise<EvidenceClaim> {
  return apiFetch<EvidenceClaim>(`${questPath(questId)}/claims`, {
    method: 'POST', body: JSON.stringify(input),
  });
}

export function selfReportCompletion(
  questId: string, completedAtUtc: string,
): Promise<MyQuestCompletionDto> {
  return apiFetch<MyQuestCompletionDto>(`${questPath(questId)}/self-report`, {
    method: 'POST', body: JSON.stringify({ completedAtUtc }),
  });
}

export function fetchMyClaims(): Promise<EvidenceClaimSummary[]> {
  return apiFetch<EvidenceClaimSummary[]>('/v1/users/me/claims');
}

export function fetchPendingClaims(): Promise<EvidenceClaimSummary[]> {
  return apiFetch<EvidenceClaimSummary[]>('/v1/admin/claims');
}

export function fetchAdminClaim(claimId: string): Promise<EvidenceClaim> {
  return apiFetch<EvidenceClaim>(`/v1/admin/claims/${encodeURIComponent(claimId)}`);
}

export function reviewEvidenceClaim(
  claimId: string, approve: boolean, reviewNote: string,
): Promise<EvidenceClaim> {
  return apiFetch<EvidenceClaim>(
    `/v1/admin/claims/${encodeURIComponent(claimId)}/review`,
    { method: 'POST', body: JSON.stringify({ approve, reviewNote: reviewNote || null }) },
  );
}
