import { createContext, useContext } from 'react';
import type { CompletionRewardDto } from '../../types/completion.ts';

export type RewardMotionPreference = 'system' | 'full' | 'reduced';
export type RewardPhase = 'flying' | 'arrived' | 'leaving';

export interface RewardFeedbackEvent extends CompletionRewardDto {
  questTitle: string;
  preview?: boolean;
  motionPreference?: RewardMotionPreference;
}

export interface RewardFeedbackContextValue {
  activeReward: RewardFeedbackEvent | null;
  phase: RewardPhase;
  showReward: (reward: RewardFeedbackEvent) => void;
  dismissReward: () => void;
}

export const RewardFeedbackContext =
  createContext<RewardFeedbackContextValue | null>(null);

export function useRewardFeedback(): RewardFeedbackContextValue {
  const value = useContext(RewardFeedbackContext);
  if (!value) {
    throw new Error('Reward feedback must be used inside RewardFeedbackProvider.');
  }
  return value;
}
