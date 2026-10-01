import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Admin invitations sent to the signed-in player that are still waiting for an answer.
export function useMyAdminInvites(enabled = true) {
  return useQuery({
    queryKey: ['MyAdminInvites'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_district_admin_invites');
      if (error) throw error;
      return data ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

// Pending invites a district's admins have sent (admin-only).
export function useDistrictAdminInvites(districtId, enabled = true) {
  return useQuery({
    queryKey: ['DistrictAdminInvites', districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_district_admin_invites', {
        p_district_id: districtId,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && !!districtId,
    staleTime: 30 * 1000,
  });
}
