import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useNotifications(userId) {
  return useQuery({
    queryKey: ['Notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!userId, // only run query if userId is provided
  });
}

export default useNotifications;
