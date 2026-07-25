import {
  PARTICIPATION_INELIGIBILITY_REASONS,
  PARTICIPATION_STATUSES,
  type MyQuestParticipationDto,
  type QuestParticipationDto,
} from '../../types/participation';

const statuses = new Set<string>(PARTICIPATION_STATUSES);
const ineligibilityReasons = new Set<string>(PARTICIPATION_INELIGIBILITY_REASONS);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

export function validateMyQuestParticipation(payload: unknown): MyQuestParticipationDto {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, [
      'status', 'canJoin', 'ineligibilityReason', 'capacityFull',
    ])
    || typeof payload.status !== 'string'
    || !statuses.has(payload.status)
    || typeof payload.canJoin !== 'boolean'
    || (
      payload.ineligibilityReason !== null
      && (
        typeof payload.ineligibilityReason !== 'string'
        || !ineligibilityReasons.has(payload.ineligibilityReason)
      )
    )
    || typeof payload.capacityFull !== 'boolean'
  ) {
    throw new Error('Quest participation state response is not valid.');
  }

  return payload as unknown as MyQuestParticipationDto;
}

export function validateQuestParticipation(payload: unknown): QuestParticipationDto {
  if (
    !isRecord(payload)
    || !hasExactKeys(payload, [
      'participationId', 'questId', 'status', 'joinedAtUtc', 'cancelledAtUtc',
    ])
    || typeof payload.participationId !== 'string'
    || !uuidPattern.test(payload.participationId)
    || typeof payload.questId !== 'string'
    || !uuidPattern.test(payload.questId)
    || (payload.status !== 'Active' && payload.status !== 'Cancelled')
    || !isUtcTimestamp(payload.joinedAtUtc)
    || (payload.cancelledAtUtc !== null && !isUtcTimestamp(payload.cancelledAtUtc))
  ) {
    throw new Error('Quest participation response is not valid.');
  }

  return payload as unknown as QuestParticipationDto;
}
