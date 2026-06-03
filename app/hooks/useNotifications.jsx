import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useNotifications(playerId) {
  return useQuery({
    queryKey: ['Notifications', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Notifications')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!playerId, // only run query if playerId is provided
  });
}

export default useNotifications;
