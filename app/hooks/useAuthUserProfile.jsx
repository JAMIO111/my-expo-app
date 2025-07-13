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

  const { data: playerData, error: playerError } = await supabase
    .from('Players')
    .select(
      `
    *,
    team:Teams!Players_team_id_fkey(
      id,
      name,
      captain,
      vice_captain,
      display_name,
      crest,
      abbreviation,
      address:Addresses(*),
      division:Divisions(
        id,
        name,
        district:Districts(
          id,
          name
        )
      )
    )
    `
    )
    .eq('auth_id', user.id)
    .single();

  if (playerError || !playerData) {
    throw new Error(playerError?.message || 'Player not found');
  }

  // 2. Fetch the active season for this district
  const districtId = playerData.team.division.district.id;

  const { data: seasonData, error: seasonError } = await supabase
    .from('Seasons')
    .select('id, start_date')
    .eq('district', districtId)
    .eq('is_active', true)
    .maybeSingle();

  if (seasonError) {
    throw new Error(seasonError.message);
  }

  // 3. Combine results as needed
  return {
    ...playerData,
    activeSeason: seasonData,
  };
};

export const useAuthUserProfile = () => {
  return useQuery({
    queryKey: ['auth-user-profile'],
    queryFn: fetchAuthUserProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
