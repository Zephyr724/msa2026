import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthQuery } from '../../hooks/useAuth.ts';
import {
  useAcknowledgeRewardEvent,
  useRewardInbox,
  rewardEventKeys,
  syncMemberRewardSurfaces,
} from '../../hooks/useCompletion.ts';
import { useRewardFeedback } from './rewardFeedback.ts';

/** Bridges durable server events into the intentionally in-memory Toast queue. */
export default function RewardInboxDelivery() {
  const auth = useAuthQuery();
  const queryClient = useQueryClient();
  const inbox = useRewardInbox(Boolean(auth.data));
  const acknowledgeReward = useAcknowledgeRewardEvent();
  const { showReward } = useRewardFeedback();

  useEffect(() => {
    if (!inbox.data) return;
    inbox.data.items.forEach((reward) => {
      showReward(reward);
      void syncMemberRewardSurfaces(queryClient, reward.questId);
      void queryClient.invalidateQueries({
        queryKey: rewardEventKeys.quest(reward.questId),
        exact: true,
      });
      // At-least-once is safer than loss: a failed acknowledgement permits a
      // later replay, while the provider deduplicates within this session.
      void acknowledgeReward(reward.rewardEventId).catch(() => undefined);
    });
  }, [acknowledgeReward, inbox.data, queryClient, showReward]);

  return null;
}
