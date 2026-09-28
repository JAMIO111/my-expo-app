import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const fetchAuthUserProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('get_user_context', {
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

// Takes session/loading from UserProvider (the single source of truth for auth
// state) instead of subscribing to Supabase auth changes a second time here.
export const useAuthUserProfile = (session, loading) => {
  return useQuery({
    queryKey: ['authUserProfile'],
    queryFn: fetchAuthUserProfile,
    enabled: !!session && !loading,

    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    placeholderData: (prev) => prev, // key fix
  });
};

export default useAuthUserProfile;
