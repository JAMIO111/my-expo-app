import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserProvider';

export default function AppRealtimeProvider({ children }) {
  const queryClient = useQueryClient();
  const { currentRole, player } = useUser();
  const appState = useRef(AppState.currentState);
  const channelsRef = useRef([]); // ✅ Persist across async boundaries

  useEffect(() => {
    if (!currentRole || !player?.id) return;

    let mounted = true;

    const teardown = async () => {
      const toRemove = [...channelsRef.current];
      channelsRef.current = [];
      for (const ch of toRemove) {
        try {
          await supabase.removeChannel(ch);
        } catch (err) {
          console.error('Failed removing channel:', err);
        }
      }
    };

    const setupRealtime = async () => {
      // ✅ Always tear down before setting up
      await teardown();

      if (!mounted) return;

      console.log('🔌 Setting up realtime channels...');

      const suffix = `${player.id}_${Date.now()}`; // ✅ Unique names avoid stale channel collisions

      const teamPlayersChannel = supabase
        .channel(`team_players_${suffix}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'TeamPlayers' },
          (payload) => {
            const playerId = payload.new?.player_id ?? payload.old?.player_id;
            const teamId = payload.new?.team_id ?? payload.old?.team_id;

            const isRequestChange =
              ['pending_both', 'pending_captain', 'pending_admin'].includes(payload.new?.status) ||
              ['pending_both', 'pending_captain', 'pending_admin'].includes(payload.old?.status);

            if (isRequestChange && teamId)
              queryClient.invalidateQueries({ queryKey: ['TeamPlayerRequest', teamId] });
            if (playerId) {
              queryClient.invalidateQueries({ queryKey: ['PlayerProfile', playerId] });
              queryClient.invalidateQueries({ queryKey: ['PlayerStats', playerId] });
            }
            if (teamId) queryClient.invalidateQueries({ queryKey: ['TeamPlayers', teamId] });
            if (playerId === player.id)
              queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
          }
        )
        .subscribe((status) => console.log('✅ TeamPlayers:', status));

      if (!mounted) {
        supabase.removeChannel(teamPlayersChannel);
        return;
      }
      channelsRef.current.push(teamPlayersChannel);

      const resultsChannel = supabase
        .channel(`results_${suffix}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Results' },
          async (payload) => {
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

            // ── Synchronous invalidations first — don't block these ──
            playerIds.forEach((id) =>
              queryClient.invalidateQueries({ queryKey: ['PlayerStats', id] })
            );
            if (fixtureId) {
              queryClient.invalidateQueries({ queryKey: ['ResultsByFixture', fixtureId] });
              queryClient.invalidateQueries({ queryKey: ['fixture-details', fixtureId] });
            }

            // ── Async lookup for knockout bracket ──
            if (fixtureId) {
              try {
                const fixture = await queryClient.ensureQueryData({
                  queryKey: ['fixture-details', fixtureId],
                  queryFn: () =>
                    supabase
                      .from('Fixtures')
                      .select('competition_instance_id')
                      .eq('id', fixtureId)
                      .single()
                      .then((r) => r.data),
                });
                if (fixture?.competition_instance_id) {
                  queryClient.invalidateQueries({
                    queryKey: ['knockout-bracket', fixture.competition_instance_id],
                  });
                }
              } catch (e) {
                console.warn('Could not resolve competition_instance_id for fixture', fixtureId, e);
              }
            }
          }
        )
        .subscribe((status) => console.log('✅ Results:', status));

      if (!mounted) {
        supabase.removeChannel(resultsChannel);
        return;
      }
      channelsRef.current.push(resultsChannel);

      const fixturesChannel = supabase
        .channel(`fixtures_${suffix}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Fixtures' }, (payload) => {
          const fixtureId = payload.new?.id ?? payload.old?.id;
          const seasonId = payload.new?.season ?? payload.old?.season;
          const divisionId = payload.new?.division ?? payload.old?.division;
          const competitionInstanceId =
            payload.new?.competition_instance_id ?? payload.old?.competition_instance_id;
          const oldMonth =
            payload.old?.date_time != null ? new Date(payload.old.date_time).getMonth() : null;
          const newMonth =
            payload.new?.date_time != null ? new Date(payload.new.date_time).getMonth() : null;
          const oldVenue = payload.old?.venue_id;
          const newVenue = payload.new?.venue_id;

          if (competitionInstanceId) {
            queryClient.invalidateQueries({
              queryKey: ['knockout-bracket', competitionInstanceId],
            });
          }

          if (fixtureId)
            queryClient.invalidateQueries({ queryKey: ['fixture-details', fixtureId] });
          if (
            oldMonth !== null &&
            newMonth !== null &&
            seasonId &&
            competitionInstanceId &&
            (newMonth !== oldMonth || newVenue !== oldVenue)
          ) {
            queryClient.invalidateQueries({
              queryKey: ['fixtures-grouped', oldMonth, seasonId, competitionInstanceId],
            });
            queryClient.invalidateQueries({
              queryKey: ['fixtures-grouped', newMonth, seasonId, competitionInstanceId],
            });
          }
          if (
            oldMonth !== null &&
            newMonth !== null &&
            seasonId &&
            divisionId &&
            competitionInstanceId
          ) {
            queryClient.invalidateQueries({
              queryKey: ['results-grouped', oldMonth, seasonId, competitionInstanceId],
            });
            queryClient.invalidateQueries({
              queryKey: ['results-grouped', newMonth, seasonId, competitionInstanceId],
            });
          }
        })
        .subscribe((status) => console.log('✅ Fixtures:', status));

      if (!mounted) {
        supabase.removeChannel(fixturesChannel);
        return;
      }
      channelsRef.current.push(fixturesChannel);
    };

    setupRealtime();

    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        console.log('📱 App resumed');
        if (channelsRef.current.length === 0 && mounted) {
          await setupRealtime();
        }
      }
      appState.current = nextState;
    });

    return () => {
      mounted = false;
      console.log('🧹 Cleaning realtime channels...');
      appStateSub.remove();
      teardown();
    };
  }, [currentRole, player?.id, queryClient]);

  return children;
}
