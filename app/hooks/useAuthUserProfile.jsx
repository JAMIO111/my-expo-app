// hooks/usePlayerProfile.js
import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

const fetchAuthUserProfile = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(authError?.message || 'User not authenticated');
  }

  const { data, error } = await supabase
    .from('Players')
    .select(
      `
      *,
      team:Teams!Players_team_id_fkey(
        id, name, captain, vice_captain, display_name, abbreviation,
        division:Divisions(id, name, district:Districts(id, name))
      )
    `
    )
    .eq('auth_id', user.id)
    .single();

  if (error || !data) {
    throw new Error(error.message || 'Player not found');
  }

  return data;
};

export const useAuthUserProfile = () => {
  return useQuery({
    queryKey: ['auth-user-profile'],
    queryFn: fetchAuthUserProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
