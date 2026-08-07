import {
  COMPLETION_METHODS,
  DISPLAY_COMPLETION_CODE_PATTERN,
  MY_COMPLETION_STATUSES,
  type CompletionCodeStatusDto,
  type GeneratedCompletionCodeDto,
  type MyQuestCompletionDto,
  type CompletionRewardDto,
  type RewardEventInboxDto,
  type RedeemCompletionResultDto,
} from '../../types/completion';

const statuses = new Set<string>(MY_COMPLETION_STATUSES);
const methods = new Set<string>(COMPLETION_METHODS);
const utcTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(?:Z|[+-]00:00)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length
    && actualKeys.every((key) => keys.includes(key));
}

function isUtcTimestamp(value: unknown): value is string {
  return typeof value === 'string' && utcTimestampPattern.test(value);
}

function isNullableUtcTimestamp(value: unknown): value is string | null {
  return value === null || isUtcTimestamp(value);
}

export function validateGeneratedCompletionCode(
  payload: unknown,
): GeneratedCompletionCodeDto {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, ['code', 'validFromUtc', 'validToUtc'])
    || typeof payload.code !== 'string'
    || !DISPLAY_COMPLETION_CODE_PATTERN.test(payload.code)
    || !isUtcTimestamp(payload.validFromUtc)
    || !isNullableUtcTimestamp(payload.validToUtc)
  ) {
    throw new Error('Generated Completion Code response is not valid.');
  }

  return payload as unknown as GeneratedCompletionCodeDto;
}

export function validateCompletionCodeStatus(
  payload: unknown,
): CompletionCodeStatusDto {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, [
      'isConfigured', 'validFromUtc', 'validToUtc', 'createdAtUtc',
    ])
    || typeof payload.isConfigured !== 'boolean'
    || !isStatusVariantConsistent(payload)
  ) {
    throw new Error('Completion Code status response is not valid.');
  }

  return payload as unknown as CompletionCodeStatusDto;
}

/** Unconfigured means all-null metadata; configured requires its timestamps. */
function isStatusVariantConsistent(payload: Record<string, unknown>): boolean {
  if (payload.isConfigured === false) {
    return payload.validFromUtc === null
      && payload.validToUtc === null
      && payload.createdAtUtc === null;
  }
  return isUtcTimestamp(payload.validFromUtc)
    && isNullableUtcTimestamp(payload.validToUtc)
    && isUtcTimestamp(payload.createdAtUtc);
}

export function validateMyQuestCompletion(payload: unknown): MyQuestCompletionDto {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, [
      'status', 'method', 'completedAtUtc', 'verifiedAtUtc',
    ])
    || typeof payload.status !== 'string'
    || !statuses.has(payload.status)
    || !isCompletionVariantConsistent(payload)
  ) {
    throw new Error('Quest completion state response is not valid.');
  }

  return payload as unknown as MyQuestCompletionDto;
}

export function validateRedeemCompletionResult(
  payload: unknown,
): RedeemCompletionResultDto {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, ['completion', 'reward'])
    || !isRecord(payload.reward)
    || !hasExactKeys(payload.reward, [
      'rewardEventId', 'questCompletionId', 'questId', 'questTitle',
      'celebrationTitle', 'celebrationMessage',
      'verificationMethod', 'xpAwarded', 'previousTotalXp', 'totalXp',
      'previousLevel', 'level', 'previousRankTitle', 'rankTitle',
      'streak', 'communityChallenge', 'unlockedAchievements',
      'createdAtUtc', 'seenAtUtc',
    ])
    || !isCompletionReward(payload.reward)
  ) {
    throw new Error('Completion reward response is not valid.');
  }

  validateMyQuestCompletion(payload.completion);
  if ((payload.completion as Record<string, unknown>).status !== 'Verified') {
    throw new Error('Completion reward response is not valid.');
  }
  return payload as unknown as RedeemCompletionResultDto;
}

export function validateCompletionReward(payload: unknown): CompletionRewardDto {
  if (!isRecord(payload) || !hasExactKeys(payload, [
    'rewardEventId', 'questCompletionId', 'questId', 'questTitle',
    'celebrationTitle', 'celebrationMessage',
    'verificationMethod', 'xpAwarded', 'previousTotalXp', 'totalXp',
    'previousLevel', 'level', 'previousRankTitle', 'rankTitle', 'streak',
    'communityChallenge', 'unlockedAchievements', 'createdAtUtc', 'seenAtUtc',
  ]) || !isCompletionReward(payload)) {
    throw new Error('Completion reward response is not valid.');
  }
  return payload as unknown as CompletionRewardDto;
}

export function validateRewardEventInbox(payload: unknown): RewardEventInboxDto {
  if (!isRecord(payload)
    || !hasExactKeys(payload, ['items'])
    || !Array.isArray(payload.items)
    || !payload.items.every((item) => {
      try { validateCompletionReward(item); return true; } catch { return false; }
    })) {
    throw new Error('Reward inbox response is not valid.');
  }
  return payload as unknown as RewardEventInboxDto;
}

function isCompletionReward(payload: Record<string, unknown>): boolean {
  return isUuid(payload.rewardEventId)
    && isUuid(payload.questCompletionId)
    && isUuid(payload.questId)
    && typeof payload.questTitle === 'string'
    && payload.questTitle.trim().length > 0
    && typeof payload.celebrationTitle === 'string'
    && payload.celebrationTitle.trim().length > 0
    && payload.celebrationTitle.trim().length <= 80
    && typeof payload.celebrationMessage === 'string'
    && payload.celebrationMessage.trim().length > 0
    && payload.celebrationMessage.trim().length <= 280
    && (payload.verificationMethod === 'CompletionCode'
      || payload.verificationMethod === 'EvidenceClaim')
    && isPositiveSafeInteger(payload.xpAwarded)
    && isNonNegativeSafeInteger(payload.previousTotalXp)
    && isNonNegativeSafeInteger(payload.totalXp)
    && payload.totalXp === payload.previousTotalXp + payload.xpAwarded
    && isLevel(payload.previousLevel)
    && isLevel(payload.level)
    && payload.level >= payload.previousLevel
    && typeof payload.previousRankTitle === 'string'
    && payload.previousRankTitle.trim().length > 0
    && typeof payload.rankTitle === 'string'
    && payload.rankTitle.trim().length > 0
    && isRewardStreak(payload.streak)
    && (payload.communityChallenge === null
      || isRewardCommunityChallenge(payload.communityChallenge))
    && Array.isArray(payload.unlockedAchievements)
    && payload.unlockedAchievements.every(isRewardAchievement)
    && isUtcTimestamp(payload.createdAtUtc)
    && isNullableUtcTimestamp(payload.seenAtUtc);
}

function isRewardStreak(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'previousWeeks', 'previousHasVerifiedImpactThisWeek',
      'weeks', 'hasVerifiedImpactThisWeek',
    ])
    && isNonNegativeSafeInteger(value.previousWeeks)
    && typeof value.previousHasVerifiedImpactThisWeek === 'boolean'
    && isNonNegativeSafeInteger(value.weeks)
    && typeof value.hasVerifiedImpactThisWeek === 'boolean';
}

function isRewardCommunityChallenge(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'challengeId', 'communityName', 'previousProgress', 'progress', 'target',
    ])
    && isUuid(value.challengeId)
    && typeof value.communityName === 'string'
    && value.communityName.trim().length > 0
    && isNonNegativeSafeInteger(value.previousProgress)
    && isNonNegativeSafeInteger(value.progress)
    && value.progress === value.previousProgress + 1
    && isPositiveSafeInteger(value.target);
}

function isRewardAchievement(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['achievementId', 'code', 'name'])
    && isUuid(value.achievementId)
    && typeof value.code === 'string'
    && value.code.trim().length > 0
    && typeof value.name === 'string'
    && value.name.trim().length > 0;
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    // ASP.NET exposes Guid values, whose canonical text shape does not
    // guarantee RFC UUID version or variant bits. Reject malformed values,
    // but do not discard valid persisted Guid identifiers such as seeded
    // Community Challenge ids.
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return isNonNegativeSafeInteger(value) && value > 0;
}

function isLevel(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 1
    && value <= 99;
}

/** "None" carries no metadata; only Verified requires a verification timestamp. */
function isCompletionVariantConsistent(payload: Record<string, unknown>): boolean {
  if (payload.status === 'None') {
    return payload.method === null
      && payload.completedAtUtc === null
      && payload.verifiedAtUtc === null;
  }
  const common = typeof payload.method === 'string'
    && methods.has(payload.method)
    && isUtcTimestamp(payload.completedAtUtc);
  return common && (payload.status === 'Verified'
    ? isUtcTimestamp(payload.verifiedAtUtc)
    : payload.verifiedAtUtc === null);
}
