import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserProvider';
import { useRealtimeScope } from '@hooks/useRealtimeScope';

export default function AppRealtimeProvider({ children }) {
  const queryClient = useQueryClient();
  const { currentRole, player, refetch } = useUser();
  const { data: scope } = useRealtimeScope(currentRole, player);
  const appState = useRef(AppState.currentState);
  const channelsRef = useRef([]);

  // Stable, content-based keys (not the array references themselves, which
  // change identity on every scope refetch even when the ids are the same)
  // so the effect below only re-runs when the actual scope changes.
  const teamIdsKey = useMemo(() => (scope?.teamIds ?? []).slice().sort().join(','), [scope]);
  const competitionInstanceIdsKey = useMemo(
    () => (scope?.competitionInstanceIds ?? []).slice().sort().join(','),
    [scope]
  );
  const fixtureIdsKey = useMemo(() => (scope?.fixtureIds ?? []).slice().sort().join(','), [scope]);
  // A primitive flag, not `scope` itself, so the effect re-runs once when the
  // scope first resolves (even if every id list turns out empty) without
  // re-running again on a later refetch that returns identical ids.
  const scopeLoaded = !!scope;

  useEffect(() => {
    if (!currentRole || !player?.id || !scope) return;

    const teamIds = scope.teamIds ?? [];
    const competitionInstanceIds = scope.competitionInstanceIds ?? [];
    const fixtureIds = scope.fixtureIds ?? [];

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

    // Shared by both TeamPlayers channels below.
    const handleTeamPlayersChange = (payload) => {
      const playerId = payload.new?.player_id ?? payload.old?.player_id;
      const teamId = payload.new?.team_id ?? payload.old?.team_id;

      if (playerId === player.id) {
        queryClient.invalidateQueries(['PlayerInvitesAndRequests', { playerId: player?.id }]);
        // A join/leave changes what this player's realtime scope should be
        // (new team, new competitions, new fixtures), so refresh it too.
        queryClient.invalidateQueries({ queryKey: ['realtime-scope'] });
        refetch();
      }

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
      if (playerId === player.id) queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
    };

    const handleResultsChange = async (payload) => {
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

      playerIds.forEach((id) => queryClient.invalidateQueries({ queryKey: ['PlayerStats', id] }));
      playerIds.forEach((id) =>
        queryClient.invalidateQueries({ queryKey: ['EntityStats', 'player', id] })
      );
      // Team stats are keyed by team, which the results payload doesn't carry --
      // this only refetches team stats queries that are currently mounted.
      queryClient.invalidateQueries({ queryKey: ['EntityStats', 'team'] });
      if (fixtureId) {
        queryClient.invalidateQueries({ queryKey: ['ResultsByFixture', fixtureId] });
        queryClient.invalidateQueries({ queryKey: ['fixture-details', fixtureId] });
      }

      if (fixtureId) {
        try {
          const fixture = await queryClient.ensureQueryData({
            // Own key: this partial row must not be cached under the full
            // ['fixture-details', id] key that useFixtureDetails reads.
            queryKey: ['fixture-competition-instance', fixtureId],
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
    };

    const handleFixturesChange = (payload) => {
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

      if (fixtureId) queryClient.invalidateQueries({ queryKey: ['fixture-details', fixtureId] });
      // Result state changes (submitted / disputed / amended / approved ...) move
      // fixtures between the "pending" lists on the home screen.
      queryClient.invalidateQueries({ queryKey: ['FixturesAwaitingResults'] });
      queryClient.invalidateQueries({ queryKey: ['EscalatedFixtures'] });
      // Player stats only count approved fixtures, so approval changes the numbers.
      if (payload.new?.approved !== payload.old?.approved) {
        queryClient.invalidateQueries({ queryKey: ['EntityStats'] });
      }
      if (
        oldMonth !== null &&
        newMonth !== null &&
        seasonId &&
        competitionInstanceId &&
        (newMonth !== oldMonth || newVenue !== oldVenue)
      ) {
        queryClient.invalidateQueries({
          queryKey: ['fixtures-grouped', competitionInstanceId, oldMonth],
        });
        queryClient.invalidateQueries({
          queryKey: ['fixtures-grouped', competitionInstanceId, newMonth],
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
          queryKey: ['results-grouped', competitionInstanceId, oldMonth],
        });
        queryClient.invalidateQueries({
          queryKey: ['results-grouped', competitionInstanceId, newMonth],
        });
      }
    };

    const addChannel = (channel) => {
      if (!mounted) {
        supabase.removeChannel(channel);
        return false;
      }
      channelsRef.current.push(channel);
      return true;
    };

    const setupRealtime = async () => {
      await teardown();

      if (!mounted) return;

      console.log('🔌 Setting up realtime channels...', {
        teamIds: teamIds.length,
        competitionInstanceIds: competitionInstanceIds.length,
        fixtureIds: fixtureIds.length,
      });

      const suffix = `${player.id}_${Date.now()}`;

      // Own row — always relevant (being added/removed/invited anywhere),
      // regardless of which team that happens on.
      addChannel(
        supabase
          .channel(`team_players_self_${suffix}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'TeamPlayers',
              filter: `player_id=eq.${player.id}`,
            },
            handleTeamPlayersChange
          )
          .subscribe((status) => console.log('✅ TeamPlayers (self):', status))
      );

      // Other players joining/leaving/requesting on team(s) this role can
      // see (the player's own team, or every team in an admin's district).
      if (teamIds.length > 0) {
        addChannel(
          supabase
            .channel(`team_players_scope_${suffix}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'TeamPlayers',
                filter: `team_id=in.(${teamIds.join(',')})`,
              },
              handleTeamPlayersChange
            )
            .subscribe((status) => console.log('✅ TeamPlayers (scope):', status))
        );
      }

      if (fixtureIds.length > 0) {
        addChannel(
          supabase
            .channel(`results_${suffix}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'Results',
                filter: `fixture_id=in.(${fixtureIds.join(',')})`,
              },
              handleResultsChange
            )
            .subscribe((status) => console.log('✅ Results:', status))
        );
      }

      if (competitionInstanceIds.length > 0) {
        addChannel(
          supabase
            .channel(`fixtures_${suffix}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'Fixtures',
                filter: `competition_instance_id=in.(${competitionInstanceIds.join(',')})`,
              },
              handleFixturesChange
            )
            .subscribe((status) => console.log('✅ Fixtures:', status))
        );
      }

      // Already server-side filtered to this player only.
      addChannel(
        supabase
          .channel(`notifications_${suffix}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Notifications',
              filter: `player_id=eq.${player.id}`,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['Notifications', player.id] });
            }
          )
          .subscribe((status) => console.log('✅ Notifications:', status))
      );
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
    // currentRole?.id (not the whole currentRole object) on purpose: UserProvider
    // hands back a new currentRole object reference on every roles refetch even
    // when nothing about it actually changed, which was tearing down and
    // rebuilding all four channels on every silent background refresh -- and
    // the TeamPlayers handler below calls refetch(), so a real event for the
    // current player was retriggering this effect on itself. Same reasoning
    // for using the sorted/joined id keys instead of the scope arrays.
  }, [
    currentRole?.id,
    player?.id,
    queryClient,
    scopeLoaded,
    teamIdsKey,
    competitionInstanceIdsKey,
    fixtureIdsKey,
  ]);

  return children;
}
