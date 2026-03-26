import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const fetchAuthUserProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('get_auth_user_profile', {
    _auth_id: user.id,
  });

  if (error) {
    console.error('RPC Error:', error);
    throw error;
  }

  // Ensure safe defaults so your UI doesn’t explode on undefined
  return {
    user,
    playerProfile: data?.playerProfile ?? null,
    roles: data?.roles ?? [],
  };
};

export const useAuthUserProfile = () => {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: ['authUserProfile'],
    queryFn: fetchAuthUserProfile,
    enabled: !!session && !loading,

    // keep your existing caching strategy
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,

    retry: 5, // don’t spam RPC if it fails
  });
};
