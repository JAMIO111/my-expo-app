import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserProvider';

export default function AppRealtimeProvider({ children }) {
  const queryClient = useQueryClient();
  const { currentRole } = useUser();

  const standingsRef = useRef(null);
  const fixturesRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const subscribe = () => {
    if (!currentRole?.team?.id) return;

    standingsRef.current = supabase
      .channel('standings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Standings' }, (payload) => {
        const divisionId = payload.new?.division ?? payload.old?.division;
        const seasonId = payload.new?.season ?? payload.old?.season;
        if (divisionId && seasonId) {
          queryClient.invalidateQueries(['Standings', divisionId, seasonId]);
        }
      })
      .subscribe();

    fixturesRef.current = supabase
      .channel('fixtures')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Fixtures' },
        (payload) => {
          const month = new Date(payload.new.date_time).getMonth();
          const seasonId = payload.new?.season;
          const divisionId = payload.new?.division;

          queryClient.invalidateQueries(['fixtures-grouped', month, seasonId, divisionId]);
          queryClient.invalidateQueries(['results-grouped', month, seasonId, divisionId]);
        }
      )
      .subscribe();
  };

  const unsubscribe = () => {
    standingsRef.current && supabase.removeChannel(standingsRef.current);
    fixturesRef.current && supabase.removeChannel(fixturesRef.current);
    standingsRef.current = null;
    fixturesRef.current = null;
  };

  useEffect(() => {
    subscribe();

    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        unsubscribe();
        subscribe();
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
