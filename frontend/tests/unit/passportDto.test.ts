import { describe, expect, it } from 'vitest';
import { validatePassportCompletionsPage } from '../../src/lib/validation/passportDto.ts';

function validItem(overrides: Record<string, unknown> = {}) {
  return {
    completionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    questId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    questTitle: 'Harbour restoration day',
    questCategory: 'RestoreNature',
    questStatus: 'Published',
    coverImage: {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      imageUrl: '/images/quests/native-planting.svg',
      altText: 'Volunteers planting native trees',
    },
    status: 'Verified',
    method: 'CompletionCode',
    completedAtUtc: '2026-07-20T09:00:00.0000000Z',
    verifiedAtUtc: '2026-07-21T09:00:00.0000000Z',
    xpAmount: 50,
    achievementNames: ['First Step'],
    ...overrides,
  };
}

function validPage(overrides: Record<string, unknown> = {}) {
  return {
    items: [validItem()],
    page: 1,
    pageSize: 12,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    ...overrides,
  };
}

describe('validatePassportCompletionsPage (F1)', () => {
  it('accepts a valid page, including a null xpAmount reward-pending row', () => {
    expect(validatePassportCompletionsPage(validPage())).toEqual(validPage());
    const pending = validPage({
      items: [validItem({ achievementNames: [], xpAmount: null })],
    });
    expect(validatePassportCompletionsPage(pending)).toEqual(pending);
  });

  it('accepts an empty page', () => {
    const empty = validPage({ items: [], totalCount: 0, totalPages: 0 });
    expect(validatePassportCompletionsPage(empty)).toEqual(empty);
  });

  it('rejects unknown or missing keys on the envelope and items', () => {
    expect(() => validatePassportCompletionsPage(validPage({ nextCursor: 'x' })))
      .toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ email: 'member@example.test' })],
      }))).toThrow();
    const missing = validItem() as Record<string, unknown>;
    delete missing.questTitle;
    expect(() => validatePassportCompletionsPage(validPage({ items: [missing] })))
      .toThrow();
    expect(() => validatePassportCompletionsPage(null)).toThrow();
  });

  it('rejects bad enums and verification labels', () => {
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ questCategory: 'UrbanRenewal' })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ questStatus: 'Draft' })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ status: 'Unknown' })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ method: 'Unknown' })],
      }))).toThrow();
  });

  it('rejects malformed identifiers and timestamps', () => {
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ completionId: 'not-a-uuid' })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ completedAtUtc: '2026-07-20 09:00:00' })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ verifiedAtUtc: '2026-07-21T09:00:00.0000000+12:00' })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ verifiedAtUtc: null })],
      }))).toThrow();
  });

  it('accepts a non-rewarding self-reported Passport record', () => {
    const result = validatePassportCompletionsPage(validPage({
      items: [validItem({
        status: 'SelfReported',
        method: 'SelfReported',
        verifiedAtUtc: null,
        xpAmount: null,
        achievementNames: [],
      })],
    }));
    expect(result.items[0]?.status).toBe('SelfReported');
  });

  it('rejects malformed achievement names', () => {
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ achievementNames: [''] })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ achievementNames: 'First Step' })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({
          achievementNames: ['First Step'],
          method: 'SelfReported',
          status: 'SelfReported',
          verifiedAtUtc: null,
          xpAmount: null,
        })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({
          achievementNames: ['First Step'],
          xpAmount: null,
        })],
      }))).toThrow();
  });

  it('rejects fractional, unsafe, and non-positive XP amounts', () => {
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ xpAmount: 50.5 })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ xpAmount: 2 ** 53 })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ xpAmount: 0 })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ xpAmount: -50 })],
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        items: [validItem({ xpAmount: '50' })],
      }))).toThrow();
  });

  it('rejects out-of-range and fractional pagination numbers', () => {
    expect(() => validatePassportCompletionsPage(validPage({ page: 0 }))).toThrow();
    expect(() => validatePassportCompletionsPage(validPage({ page: 1.5 }))).toThrow();
    expect(() => validatePassportCompletionsPage(validPage({ pageSize: 0 }))).toThrow();
    expect(() => validatePassportCompletionsPage(validPage({ pageSize: 51 }))).toThrow();
    expect(() => validatePassportCompletionsPage(validPage({ totalCount: -1 }))).toThrow();
    expect(() => validatePassportCompletionsPage(validPage({ totalPages: -1 }))).toThrow();
    expect(() => validatePassportCompletionsPage(validPage({ totalCount: 2 ** 53 })))
      .toThrow();
  });

  it('rejects incoherent envelope flags and overflowing items', () => {
    expect(() =>
      validatePassportCompletionsPage(validPage({ hasNextPage: true }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({ hasPreviousPage: true }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({
        page: 2,
        totalPages: 2,
        hasPreviousPage: false,
      }))).toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({ pageSize: 1, items: [validItem(), validItem()] })))
      .toThrow();
    expect(() =>
      validatePassportCompletionsPage(validPage({ hasNextPage: 'no' }))).toThrow();
  });
});
