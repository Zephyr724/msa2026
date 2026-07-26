import { describe, expect, it } from 'vitest';
import {
  validateCompletionCodeStatus,
  validateGeneratedCompletionCode,
  validateMyQuestCompletion,
} from '../../src/lib/validation/completionDto';

const generated = {
  code: 'ABCDE-23456',
  validFromUtc: '2026-07-25T08:00:00.0000000+00:00',
  validToUtc: '2026-08-01T11:30:00.000Z',
};

const configuredStatus = {
  isConfigured: true,
  validFromUtc: '2026-07-25T08:00:00.0000000+00:00',
  validToUtc: null,
  createdAtUtc: '2026-07-25T08:00:00Z',
};

const unconfiguredStatus = {
  isConfigured: false,
  validFromUtc: null,
  validToUtc: null,
  createdAtUtc: null,
};

const noneCompletion = {
  status: 'None',
  method: null,
  completedAtUtc: null,
  verifiedAtUtc: null,
};

const verifiedCompletion = {
  status: 'Verified',
  method: 'CompletionCode',
  completedAtUtc: '2026-07-25T09:00:00.0000000+00:00',
  verifiedAtUtc: '2026-07-25T09:00:00.000Z',
};

describe('generated Completion Code DTO validation', () => {
  it('accepts the exact reveal-once generation/rotation contract', () => {
    expect(validateGeneratedCompletionCode(generated)).toEqual(generated);
    expect(validateGeneratedCompletionCode({ ...generated, validToUtc: null }))
      .toEqual({ ...generated, validToUtc: null });
  });

  it('rejects malformed, partial, and over-seeded generation responses', () => {
    expect(() => validateGeneratedCompletionCode({ validFromUtc: generated.validFromUtc }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode({ ...generated, codeHash: 'secret' }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode({ ...generated, code: 'ABCDE23456' }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode({ ...generated, code: 'ABCDE-2345' }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode({ ...generated, code: 'abcde-23456' }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode({ ...generated, code: 'ABCDE-IOO11' }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode({ ...generated, validFromUtc: 'soon' }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode({ ...generated, validToUtc: 42 }))
      .toThrow();
    expect(() => validateGeneratedCompletionCode(null)).toThrow();
  });
});

describe('Completion Code status DTO validation', () => {
  it('accepts configured and unconfigured metadata-only contracts', () => {
    expect(validateCompletionCodeStatus(configuredStatus)).toEqual(configuredStatus);
    expect(validateCompletionCodeStatus(unconfiguredStatus)).toEqual(unconfiguredStatus);
  });

  it('rejects status responses carrying plaintext, hashes, or secret material', () => {
    expect(() => validateCompletionCodeStatus({ ...configuredStatus, code: generated.code }))
      .toThrow();
    expect(() => validateCompletionCodeStatus({ ...configuredStatus, codeHash: 'hash' }))
      .toThrow();
    expect(() => validateCompletionCodeStatus({ ...configuredStatus, secret: 'x' }))
      .toThrow();
  });

  it('rejects malformed status responses', () => {
    expect(() => validateCompletionCodeStatus({ ...configuredStatus, isConfigured: 'yes' }))
      .toThrow();
    expect(() => validateCompletionCodeStatus({ ...configuredStatus, createdAtUtc: 'now' }))
      .toThrow();
    expect(() => validateCompletionCodeStatus({ isConfigured: true })).toThrow();
    expect(() => validateCompletionCodeStatus([])).toThrow();
  });

  it('rejects semantically inconsistent status variants', () => {
    expect(() => validateCompletionCodeStatus({
      ...unconfiguredStatus,
      validFromUtc: configuredStatus.validFromUtc,
    })).toThrow();
    expect(() => validateCompletionCodeStatus({
      ...unconfiguredStatus,
      createdAtUtc: configuredStatus.createdAtUtc,
    })).toThrow();
    expect(() => validateCompletionCodeStatus({
      ...configuredStatus,
      validFromUtc: null,
    })).toThrow();
    expect(() => validateCompletionCodeStatus({
      ...configuredStatus,
      createdAtUtc: null,
    })).toThrow();
  });
});

describe('current-user completion state DTO validation', () => {
  it('accepts the exact four-field None and Verified contracts', () => {
    expect(validateMyQuestCompletion(noneCompletion)).toEqual(noneCompletion);
    expect(validateMyQuestCompletion(verifiedCompletion)).toEqual(verifiedCompletion);
  });

  it('accepts pending evidence and self-reported variants without verification time', () => {
    expect(validateMyQuestCompletion({
      status: 'Pending',
      method: 'EvidenceClaim',
      completedAtUtc: '2026-07-27T00:00:00Z',
      verifiedAtUtc: null,
    }).status).toBe('Pending');
    expect(validateMyQuestCompletion({
      status: 'SelfReported',
      method: 'SelfReported',
      completedAtUtc: '2026-07-27T00:00:00Z',
      verifiedAtUtc: null,
    }).status).toBe('SelfReported');
  });

  it('rejects identity, quest, reward, and plaintext fields', () => {
    expect(() => validateMyQuestCompletion({ ...verifiedCompletion, completionId: 'id' }))
      .toThrow();
    expect(() => validateMyQuestCompletion({ ...verifiedCompletion, questId: 'id' }))
      .toThrow();
    expect(() => validateMyQuestCompletion({ ...verifiedCompletion, userId: 'id' }))
      .toThrow();
    expect(() => validateMyQuestCompletion({ ...verifiedCompletion, xpAwarded: 50 }))
      .toThrow();
    expect(() => validateMyQuestCompletion({ ...verifiedCompletion, code: generated.code }))
      .toThrow();
  });

  it('rejects unknown enum values and malformed fields', () => {
    expect(() => validateMyQuestCompletion({ ...noneCompletion, status: 'Unknown' }))
      .toThrow();
    expect(() => validateMyQuestCompletion({ ...verifiedCompletion, method: 'Unknown' }))
      .toThrow();
    expect(() => validateMyQuestCompletion({ ...verifiedCompletion, completedAtUtc: 'yesterday' }))
      .toThrow();
    expect(() => validateMyQuestCompletion({ status: 'None' })).toThrow();
  });

  it('rejects semantically inconsistent completion-state variants', () => {
    expect(() => validateMyQuestCompletion({
      ...noneCompletion,
      method: 'CompletionCode',
    })).toThrow();
    expect(() => validateMyQuestCompletion({
      ...noneCompletion,
      completedAtUtc: verifiedCompletion.completedAtUtc,
    })).toThrow();
    expect(() => validateMyQuestCompletion({
      ...verifiedCompletion,
      method: null,
    })).toThrow();
    expect(() => validateMyQuestCompletion({
      ...verifiedCompletion,
      completedAtUtc: null,
    })).toThrow();
    expect(() => validateMyQuestCompletion({
      ...verifiedCompletion,
      verifiedAtUtc: null,
    })).toThrow();
  });
});
