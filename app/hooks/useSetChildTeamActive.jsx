import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Switch a squad between active and inactive (captain, club captains or a league admin).
export function useSetChildTeamActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, active }) => {
      const { data, error } = await supabase.rpc('set_child_team_active', {
        p_team_id: teamId,
        p_active: active,
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.message || 'Could not update the team');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
    },
  });
}

export default useSetChildTeamActive;
