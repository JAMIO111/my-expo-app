import { useEffect } from 'react';
import supabase from '@lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@contexts/UserProvider';

const AppRealtimeProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { currentRole } = useUser();

  // Standings listener
  useEffect(() => {
    const standingsChannel = supabase
      .channel('public:Standings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Standings',
        },
        (payload) => {
          console.log('Standings change received:', payload);
          const divisionId = payload.new?.division ?? payload.old?.division;
          const seasonId = payload.new?.season ?? payload.old?.season;

          if (divisionId && seasonId) {
            queryClient.invalidateQueries({
              queryKey: ['Standings', divisionId, seasonId],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(standingsChannel);
    };
  }, [queryClient]);

  // Fixtures is_complete listener
  useEffect(() => {
    const PendingApprovalChannel = supabase
      .channel('public:FixturesPendingApproval')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Fixtures',
        },
        (payload) => {
          const oldComplete = payload.old?.is_complete;
          const newComplete = payload.new?.is_complete;
          const affectedTeam = payload.new?.away_team;

          console.log('Fixtures change received:', payload);

          if (oldComplete !== newComplete && affectedTeam === currentRole?.team?.id) {
            queryClient.invalidateQueries({
              queryKey: ['ResultsPendingApproval', affectedTeam],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(PendingApprovalChannel);
    };
  }, [queryClient, currentRole?.team?.id]);

  return children;
};

export default AppRealtimeProvider;
