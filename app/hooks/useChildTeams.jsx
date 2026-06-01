import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useChildTeams({ teamId, playerId }) {
  return useQuery({
    queryKey: ['ChildTeams', teamId, playerId],
    queryFn: async () => {
      if (!teamId || !playerId) return [];
      const { data, error } = await supabase.rpc('get_player_child_teams', {
        p_player_id: playerId,
        p_team_id: teamId,
      });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!teamId && !!playerId, // only run query if teamId and playerId are provided
  });
}

export default useChildTeams;
