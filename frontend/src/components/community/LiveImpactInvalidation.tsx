import { HubConnectionBuilder } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { communityKeys } from '../../hooks/useCommunity';
import { leaderboardKeys } from '../../hooks/useLeaderboard';

export default function LiveImpactInvalidation() {
  const client = useQueryClient();

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/leaderboard')
      .withAutomaticReconnect()
      .build();
    connection.on('ImpactChanged', () => {
      void client.invalidateQueries({ queryKey: leaderboardKeys.all });
      void client.invalidateQueries({ queryKey: communityKeys.challenges });
      void client.invalidateQueries({ queryKey: communityKeys.streak });
    });
    void connection.start().catch(() => {
      // REST queries remain authoritative; a socket failure is non-fatal.
    });
    return () => {
      void connection.stop();
    };
  }, [client]);

  return null;
}
