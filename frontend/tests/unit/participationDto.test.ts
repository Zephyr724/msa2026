import { describe, expect, it } from 'vitest';
import {
  validateMyQuestParticipation,
  validateMyQuestParticipationList,
  validateQuestParticipation,
} from '../../src/lib/validation/participationDto';

const state = {
  status: 'Cancelled',
  canJoin: true,
  ineligibilityReason: null,
  capacityFull: false,
};

const participation = {
  participationId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  questId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  status: 'Active',
  joinedAtUtc: '2026-07-25T00:00:00.0000000+00:00',
  cancelledAtUtc: null,
};

const myQuestItem = {
  participationId: participation.participationId,
  status: 'Active',
  joinedAtUtc: participation.joinedAtUtc,
  cancelledAtUtc: null,
  quest: {
    id: participation.questId,
    title: 'Dated Stream Cleanup',
    description: 'Restore a local stream.',
    category: 'CleanReduceWaste',
    sourceType: 'OrganizerOwned',
    registrationMode: 'Native',
    difficulty: 'Easy',
    xpAward: 50,
    capacity: 30,
    startAtUtc: '2026-08-01T00:00:00Z',
    endAtUtc: null,
    locationRegion: null,
    locationDescription: 'Oakley Creek',
    coverImage: null,
  },
};

describe('participation DTO validation', () => {
  it('accepts the exact current-user state contract', () => {
    expect(validateMyQuestParticipation(state)).toEqual(state);
  });

  it('rejects privacy-sensitive or unexpected state fields', () => {
    expect(() => validateMyQuestParticipation({
      ...state,
      userId: 'secret-user',
    })).toThrow();
    expect(() => validateMyQuestParticipation({
      ...state,
      participationId: participation.participationId,
    })).toThrow();
    expect(() => validateMyQuestParticipation({
      ...state,
      participantCount: 3,
    })).toThrow();
  });

  it('rejects unknown status and ineligibility values', () => {
    expect(() => validateMyQuestParticipation({ ...state, status: 'Pending' })).toThrow();
    expect(() => validateMyQuestParticipation({
      ...state,
      ineligibilityReason: 'NotAllowed',
    })).toThrow();
  });

  it('accepts exact Join and Cancel response contracts', () => {
    expect(validateQuestParticipation(participation)).toEqual(participation);
    expect(validateQuestParticipation({
      ...participation,
      status: 'Cancelled',
      cancelledAtUtc: '2026-07-25T01:00:00Z',
    }).status).toBe('Cancelled');
  });

  it('rejects malformed participation identifiers, dates, and extra identity fields', () => {
    expect(() => validateQuestParticipation({
      ...participation,
      participationId: 'not-a-uuid',
    })).toThrow();
    expect(() => validateQuestParticipation({
      ...participation,
      joinedAtUtc: 'yesterday',
    })).toThrow();
    expect(() => validateQuestParticipation({
      ...participation,
      email: 'private@example.test',
    })).toThrow();
  });

  it('accepts the exact My Quests list contract', () => {
    expect(validateMyQuestParticipationList([myQuestItem])).toEqual([myQuestItem]);
  });

  it('rejects malformed or privacy-expanded My Quests list items', () => {
    expect(() => validateMyQuestParticipationList({ items: [myQuestItem] })).toThrow();
    expect(() => validateMyQuestParticipationList([{
      ...myQuestItem,
      userId: 'secret-user',
    }])).toThrow();
    expect(() => validateMyQuestParticipationList([{
      ...myQuestItem,
      quest: { ...myQuestItem.quest, organizerEmail: 'private@example.test' },
    }])).toThrow();
  });
});
