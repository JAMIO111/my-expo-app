import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTeamInvites(playerId, teamId) {
  return useQuery({
    queryKey: ['TeamInvites', playerId, teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_invites', {
        _player_id: playerId,
        _team_id: teamId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      return data.data;
    },
    enabled: !!playerId && !!teamId,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export default useTeamInvites;
