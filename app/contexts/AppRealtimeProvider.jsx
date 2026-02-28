import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserProvider';

export default function AppRealtimeProvider({ children }) {
  const queryClient = useQueryClient();
  const { currentRole, player } = useUser();

  const standingsRef = useRef(null);
  const fixturesRef = useRef(null);
  const teamPlayersRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const subscribe = () => {
    if (!currentRole?.team?.id) return;

    // --- TeamPlayers listener ---
    if (teamPlayersRef.current) supabase.removeChannel(teamPlayersRef.current);
    teamPlayersRef.current = supabase
      .channel('team_players')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'TeamPlayers' }, // quotes required for exact casing
        (payload) => {
          console.log('TeamPlayers update payload:', payload);
          const playerId = payload.new?.player_id ?? payload.old?.player_id;
          const teamId = payload.new?.team_id ?? payload.old?.team_id;

          if (playerId) queryClient.invalidateQueries(['PlayerProfile', playerId]);
          if (teamId) queryClient.invalidateQueries(['TeamPlayers', teamId]);
          if (playerId === player?.id) {
            console.log(
              'Current user affected by TeamPlayers change, invalidating authUserProfile'
            );
            queryClient.invalidateQueries(['authUserProfile']);
          }
        }
      )
      .subscribe((status) => console.log('TeamPlayers subscription status:', status));

    // --- Standings listener ---
    if (standingsRef.current) supabase.removeChannel(standingsRef.current);
    standingsRef.current = supabase
      .channel('standings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Standings' }, (payload) => {
        console.log('Standings update payload:', payload);
        const divisionId = payload.new?.division ?? payload.old?.division;
        const seasonId = payload.new?.season ?? payload.old?.season;
        if (divisionId && seasonId) {
          queryClient.invalidateQueries(['Standings', divisionId, seasonId]);
        }
      })
      .subscribe((status) => console.log('Standings subscription status:', status));

    // --- Fixtures listener ---
    if (fixturesRef.current) supabase.removeChannel(fixturesRef.current);
    fixturesRef.current = supabase
      .channel('fixtures-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Fixtures' }, (payload) => {
        console.log('Fixtures update payload:', payload);
        const month = payload.new ? new Date(payload.new.date_time).getMonth() : null;
        const seasonId = payload.new?.season ?? payload.old?.season;
        const divisionId = payload.new?.division ?? payload.old?.division;

        if (month != null && seasonId && divisionId) {
          queryClient.invalidateQueries(['fixtures-grouped', month, seasonId, divisionId]);
          queryClient.invalidateQueries(['results-grouped', month, seasonId, divisionId]);
        }
      })
      .subscribe((status) => console.log('Fixtures subscription status:', status));
  };

  const unsubscribe = () => {
    if (standingsRef.current) supabase.removeChannel(standingsRef.current);
    if (fixturesRef.current) supabase.removeChannel(fixturesRef.current);
    if (teamPlayersRef.current) supabase.removeChannel(teamPlayersRef.current);

    standingsRef.current = null;
    fixturesRef.current = null;
    teamPlayersRef.current = null;
  };

  useEffect(() => {
    subscribe();

    const appStateListener = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        console.log('App resumed, resubscribing all listeners');
        unsubscribe();
        subscribe();
      }
      appState.current = next;
    });

    return () => {
      unsubscribe();
      appStateListener.remove();
    };
  }, [currentRole?.team?.id]);

  return children;
}
