import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAcceptTeamInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId, playerId }) => {
      const { data, error } = await supabase.rpc('accept_child_team_invite', {
        _invite_id: inviteId,
        _player_id: playerId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.code);

      return data;
    },
    onSuccess: (_, { playerId }) => {
      queryClient.invalidateQueries({ queryKey: ['ChildTeamInvites', playerId] });
      queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
    },
  });
}

export default useAcceptTeamInvite;
