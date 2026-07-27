import { HubConnectionBuilder } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { communityKeys } from '../../hooks/useCommunity';
import { leaderboardKeys } from '../../hooks/useLeaderboard';
import { useUiStore } from '../../stores/useUiStore.ts';

export default function LiveImpactInvalidation() {
  const client = useQueryClient();
  const setLiveImpactStatus = useUiStore((state) => state.setLiveImpactStatus);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    setLiveImpactStatus('connecting');
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/leaderboard')
      .withAutomaticReconnect()
      .build();
    connection.onreconnecting(() => setLiveImpactStatus('reconnecting'));
    connection.onreconnected(() => setLiveImpactStatus('live'));
    connection.onclose(() => setLiveImpactStatus('unavailable'));
    connection.on('ImpactChanged', () => {
      void client.invalidateQueries({ queryKey: leaderboardKeys.all });
      void client.invalidateQueries({ queryKey: communityKeys.challenges });
      void client.invalidateQueries({ queryKey: communityKeys.streak });
    });
    void connection.start()
      .then(() => setLiveImpactStatus('live'))
      .catch(() => {
        setLiveImpactStatus('unavailable');
        // REST queries remain authoritative; a socket failure is non-fatal.
      });
    return () => {
      void connection.stop();
    };
  }, [client, setLiveImpactStatus]);

  return null;
}
