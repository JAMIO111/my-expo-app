import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Computes the set of ids AppRealtimeProvider needs to build *filtered*
 * realtime subscriptions instead of listening to entire tables app-wide.
 *
 * - teamIds: the player's own team, or every team in an admin's district
 * - competitionInstanceIds: competitions those teams (or the player, for
 *   individual competitions) are actually taking part in
 * - fixtureIds: fixtures under those competition instances
 *
 * Kept on a real staleTime so it doesn't refetch (and therefore doesn't
 * cause AppRealtimeProvider to rebuild its channels) on every render --
 * only when the role/team/district actually changes, or something calls
 * queryClient.invalidateQueries(['realtime-scope', ...]) after a join/leave.
 */
export function useRealtimeScope(currentRole, player) {
  const roleType = currentRole?.type ?? null;
  const teamId = currentRole?.team?.id ?? null;
  const districtId = currentRole?.district?.id ?? null;
  const playerId = player?.id ?? null;

  return useQuery({
    queryKey: ['realtime-scope', roleType, teamId, districtId, playerId],
    enabled: !!playerId && !!roleType,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,

    queryFn: async () => {
      // Admins need visibility across their whole district, not just one
      // team; players only need their own team.
      let teamIds = [];
      if (roleType === 'admin' && districtId) {
        const { data, error } = await supabase
          .from('Teams')
          .select('id')
          .eq('district', districtId);
        if (error) throw error;
        teamIds = (data ?? []).map((t) => t.id);
      } else if (teamId) {
        teamIds = [teamId];
      }

      // Competitions those team(s) are entered in, plus any the player is
      // individually entered in (competitor_type: 'individual').
      const orClauses = [];
      if (teamIds.length) orClauses.push(`team_id.in.(${teamIds.join(',')})`);
      if (playerId) orClauses.push(`player_id.eq.${playerId}`);

      let competitionInstanceIds = [];
      if (orClauses.length) {
        const { data, error } = await supabase
          .from('CompetitionParticipants')
          .select('competition_instance_id')
          .or(orClauses.join(','));
        if (error) throw error;
        competitionInstanceIds = [
          ...new Set((data ?? []).map((p) => p.competition_instance_id).filter(Boolean)),
        ];
      }

      let fixtureIds = [];
      if (competitionInstanceIds.length) {
        const { data, error } = await supabase
          .from('Fixtures')
          .select('id')
          .in('competition_instance_id', competitionInstanceIds);
        if (error) throw error;
        fixtureIds = (data ?? []).map((f) => f.id);
      }

      return { teamIds, competitionInstanceIds, fixtureIds };
    },
  });
}

export default useRealtimeScope;
