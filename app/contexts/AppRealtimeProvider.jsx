import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserProvider';

export default function AppRealtimeProvider({ children }) {
  const queryClient = useQueryClient();
  const { currentRole, player } = useUser();

  const channelsRef = useRef([]);
  const isSubscribedRef = useRef(false);
  const appState = useRef(AppState.currentState);

  const subscribe = () => {
    if (!currentRole?.team?.id) return;
    if (isSubscribedRef.current) return; // 🛑 prevent duplicates

    console.log('Subscribing to realtime channels...');
    isSubscribedRef.current = true;

    const channels = [];

    // --- TeamPlayers ---
    const teamPlayers = supabase
      .channel('team_players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'TeamPlayers' }, (payload) => {
        const playerId = payload.new?.player_id ?? payload.old?.player_id;
        const teamId = payload.new?.team_id ?? payload.old?.team_id;

        if (playerId) queryClient.invalidateQueries(['PlayerProfile', playerId]);
        if (teamId) queryClient.invalidateQueries(['TeamPlayers', teamId]);

        if (playerId === player?.id) {
          queryClient.invalidateQueries(['authUserProfile']);
        }
      })
      .subscribe((status) => console.log('TeamPlayers:', status));

    channels.push(teamPlayers);

    // --- Results ---
    const results = supabase
      .channel('results-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Results' }, (payload) => {
        const fixtureId = payload.new?.fixture_id ?? payload.old?.fixture_id;

        const playerIds = new Set(
          [
            payload.new?.home_player_1,
            payload.new?.home_player_2,
            payload.new?.away_player_1,
            payload.new?.away_player_2,
            payload.old?.home_player_1,
            payload.old?.home_player_2,
            payload.old?.away_player_1,
            payload.old?.away_player_2,
          ].filter(Boolean)
        );

        playerIds.forEach((id) => {
          queryClient.invalidateQueries(['PlayerStats', id]);
        });

        if (fixtureId) {
          queryClient.invalidateQueries(['ResultsByFixture', fixtureId]);
        }
      })
      .subscribe((status) => console.log('Results:', status));

    channels.push(results);

    // --- Fixtures ---
    const fixtures = supabase
      .channel('fixtures-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Fixtures' }, (payload) => {
        const month = payload.new ? new Date(payload.new.date_time).getMonth() : null;
        const seasonId = payload.new?.season ?? payload.old?.season;
        const divisionId = payload.new?.division ?? payload.old?.division;

        if (month != null && seasonId && divisionId) {
          queryClient.invalidateQueries(['fixtures-grouped', month, seasonId, divisionId]);
          queryClient.invalidateQueries(['results-grouped', month, seasonId, divisionId]);
        }
      })
      .subscribe((status) => console.log('Fixtures:', status));

    channels.push(fixtures);

    channelsRef.current = channels;
  };

  const unsubscribe = () => {
    console.log('Unsubscribing from realtime channels...');

    channelsRef.current.forEach((ch) => {
      supabase.removeChannel(ch);
    });

    channelsRef.current = [];
    isSubscribedRef.current = false;
  };

  useEffect(() => {
    subscribe();

    const sub = AppState.addEventListener('change', (next) => {
      // Only react when coming BACK to active
      if (appState.current.match(/inactive|background/) && next === 'active') {
        console.log('App resumed');

        // ❗️DO NOT blindly resubscribe
        // Only resubscribe if nothing is active
        if (!isSubscribedRef.current) {
          subscribe();
        }
      }

      appState.current = next;
    });

    return () => {
      unsubscribe();
      sub.remove();
    };
  }, [currentRole?.team?.id]);

  return children;
}
