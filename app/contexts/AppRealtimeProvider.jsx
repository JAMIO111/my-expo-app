import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@contexts/UserProvider';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

const AppRealtimeProvider = ({ children }) => {
  const { client: supabase, refreshClient } = useSupabaseClient();
  const queryClient = useQueryClient();
  const { currentRole } = useUser();

  const standingsChannelRef = useRef(null);
  const fixturesChannelRef = useRef(null);

  const subscribeToStandings = () => {
    const channel = supabase
      .channel('public:Standings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Standings' }, (payload) => {
        const divisionId = payload.new?.division ?? payload.old?.division;
        const seasonId = payload.new?.season ?? payload.old?.season;
        if (divisionId && seasonId) {
          queryClient.invalidateQueries(['Standings', divisionId, seasonId]);
        }
      })
      .subscribe();

    standingsChannelRef.current = channel;
  };

  const subscribeToFixtures = () => {
    const channel = supabase
      .channel('public:FixturesCombined')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Fixtures' },
        (payload) => {
          const oldComplete = payload.old?.is_complete;
          const newComplete = payload.new?.is_complete;
          const affectedTeam = payload.new?.away_team;
          const month = new Date(payload.new.date_time).getMonth();
          const seasonId = payload.new?.season;
          const divisionId = payload.new?.division;

          if (oldComplete !== newComplete) {
            queryClient.invalidateQueries(['fixtures-grouped', month, seasonId, divisionId]);
            queryClient.invalidateQueries(['results-grouped', month, seasonId, divisionId]);

            if (affectedTeam === currentRole?.team?.id) {
              queryClient.invalidateQueries(['ResultsPendingApproval', affectedTeam]);
            }
          } else {
            if (newComplete === false) {
              queryClient.invalidateQueries(['fixtures-grouped', month, seasonId, divisionId]);
            } else if (newComplete === true) {
              queryClient.invalidateQueries(['results-grouped', month, seasonId, divisionId]);
            }
          }
        }
      )
      .subscribe();

    fixturesChannelRef.current = channel;
  };

  // Subscriptions on mount
  useEffect(() => {
    if (!currentRole?.team?.id) return;
    subscribeToStandings();
    subscribeToFixtures();

    return () => {
      standingsChannelRef.current && supabase.removeChannel(standingsChannelRef.current);
      fixturesChannelRef.current && supabase.removeChannel(fixturesChannelRef.current);
    };
  }, [supabase, currentRole?.team?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshClient();
      }
    });
    return () => subscription.remove();
  }, []);

  return children;
};

export default AppRealtimeProvider;
