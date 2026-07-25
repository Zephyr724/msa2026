export const PARTICIPATION_STATUSES = ['None', 'Active', 'Cancelled'] as const;
export const PARTICIPATION_INELIGIBILITY_REASONS = [
  'OwnQuest',
  'AlreadyParticipating',
  'QuestNotPublished',
  'RegistrationModeNotSupported',
  'QuestEnded',
  'CapacityFull',
] as const;

export type ParticipationStatus = (typeof PARTICIPATION_STATUSES)[number];
export type ParticipationIneligibilityReason =
  (typeof PARTICIPATION_INELIGIBILITY_REASONS)[number];

export interface QuestParticipationDto {
  participationId: string;
  questId: string;
  status: Exclude<ParticipationStatus, 'None'>;
  joinedAtUtc: string;
  cancelledAtUtc: string | null;
}

export interface MyQuestParticipationDto {
  status: ParticipationStatus;
  canJoin: boolean;
  ineligibilityReason: ParticipationIneligibilityReason | null;
  capacityFull: boolean;
}
