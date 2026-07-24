import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOrganizerQuests } from '../../src/lib/api/organizerQuests';
import { resetCsrfToken } from '../../src/lib/api/apiFetch';
import {
  validateQuestManagementDetail,
  validateQuestManagementList,
} from '../../src/lib/validation/questManagementDto';
import {
  jsonResponse,
  managedQuestDetail,
  managedQuestListItem,
} from '../organizerTestUtils';

describe('Quest management DTO validation', () => {
  afterEach(() => {
    resetCsrfToken();
    vi.unstubAllGlobals();
  });

  it('accepts the exact Slice 3A list and detail records', () => {
    expect(validateQuestManagementList([managedQuestListItem()])).toHaveLength(1);
    expect(validateQuestManagementDetail(managedQuestDetail()).version).toBe(7);
  });

  it('rejects missing and extra response keys', () => {
    const { title: _, ...missingTitle } = managedQuestListItem();
    expect(() => validateQuestManagementList([missingTitle])).toThrow();
    expect(() => validateQuestManagementDetail({
      ...managedQuestDetail(),
      inventedField: true,
    })).toThrow();
  });

  it('rejects bad enums, malformed UTC timestamps, and invalid versions', () => {
    expect(() => validateQuestManagementList([
      { ...managedQuestListItem(), status: 'Deleted' },
    ])).toThrow();
    expect(() => validateQuestManagementDetail({
      ...managedQuestDetail(),
      updatedAtUtc: '24 July 2026',
    })).toThrow();
    expect(() => validateQuestManagementDetail({
      ...managedQuestDetail(),
      version: -1,
    })).toThrow();
  });

  it('constructs the management URL with exactly one /api prefix', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([managedQuestListItem()]));
    vi.stubGlobal('fetch', fetchMock);

    await fetchOrganizerQuests();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/organizer/quests');
    expect(fetchMock.mock.calls[0]?.[0]).not.toContain('/api/api/');
  });
});
