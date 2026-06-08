import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@lib/supabase';

export function useLeaveChildTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, playerId }) => {
      const { data, error } = await supabase.rpc('leave_child_team', {
        _team_id: teamId,
        _player_id: playerId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.code);

      return data;
    },
    onSuccess: (_, { playerId }) => {
      queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
    },
  });
}

export default useLeaveChildTeam;
