import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@lib/supabase';

export function useSaveChildTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('save_child_team', payload);
      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
    },
  });
}
