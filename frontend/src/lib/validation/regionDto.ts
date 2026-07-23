import type { RegionSummaryDto } from '../../types/region';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUuidString(value: unknown): value is string {
  return isString(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isNullableUuid(value: unknown): value is string | null {
  // null is acceptable for nullable Guid-backed fields.
  // undefined is NOT acceptable — the property must be present and must be null or a valid UUID.
  if (value === null) return true;
  if (value === undefined) return false;
  return isUuidString(value);
}

const ACCEPTED_REGION_TYPES = new Set(['Country', 'AdministrativeArea', 'LocalArea']);

function isValidRegionType(value: unknown): value is string {
  return isString(value) && ACCEPTED_REGION_TYPES.has(value);
}

export function isValidRegionSummaryDto(value: unknown): value is RegionSummaryDto {
  if (!isRecord(value)) return false;
  if (!isUuidString(value.id)) return false;
  if (!isString(value.name)) return false;
  if (!isValidRegionType(value.type)) return false;
  // parentRegionId is Guid? — must be null or a valid UUID.
  // Reject arbitrary strings, empty strings, numbers, and missing properties.
  if (value.parentRegionId === undefined) return false;
  if (!isNullableUuid(value.parentRegionId)) return false;
  return true;
}

export function validateRegionList(payload: unknown): RegionSummaryDto[] {
  if (!Array.isArray(payload)) {
    throw new Error('Region list response is not an array.');
  }
  const result: RegionSummaryDto[] = [];
  for (let i = 0; i < payload.length; i += 1) {
    const item = payload[i];
    if (!isValidRegionSummaryDto(item)) {
      throw new Error(`Invalid Region item at index ${i}.`);
    }
    result.push(item);
  }
  return result;
}

export function validateRegionDetail(payload: unknown): RegionSummaryDto {
  if (!isValidRegionSummaryDto(payload)) {
    throw new Error('Region detail response is not valid.');
  }
  return payload;
}

export function validateRegionChildren(payload: unknown): RegionSummaryDto[] {
  return validateRegionList(payload);
}

export function validateRegionAncestors(payload: unknown): RegionSummaryDto[] {
  return validateRegionList(payload);
}