import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTeamProfile(teamId) {
  return useQuery({
    queryKey: ['TeamProfile', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Teams')
        .select(
          `
          *,
          address:Addresses(*),
          division:Divisions(
            id,
            name,
            admin_approval_required,
            district:Districts(id, name)
          )
        `
        )
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
