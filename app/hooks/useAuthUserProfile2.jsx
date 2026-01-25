import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export const fetchAuthUserProfile = async (supabase) => {
  // Step 1: Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(authError?.message || 'User not authenticated');
  }

  // Step 2: Fetch Player ID (if exists)
  const { data: player, error: playerError } = await supabase
    .from('Players')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (playerError) {
    throw new Error(playerError.message);
  }

  let fullPlayerProfile = null;
  let teamRoles = [];

  if (player) {
    // Fetch full player profile with all related info
    const { data: playerData, error: fullPlayerError } = await supabase
      .from('Players')
      .select('*')
      .eq('id', player.id)
      .single();

    if (fullPlayerError) {
      throw new Error(fullPlayerError.message);
    }

    fullPlayerProfile = playerData;

    // Fetch TeamRoles as you did before
    const { data: teamPlayerData, error: teamPlayerError } = await supabase
      .from('TeamPlayers')
      .select(
        `
        id,
        team_id,
        role,
        team:Teams (
          id,
          name,
          display_name,
          crest,
          abbreviation,
          captain:Players!Teams_captain_fkey (
            id,
            first_name,
            surname,
            nickname
          ),
          vice_captain:Players!Teams_vice_captain_fkey (
            id,
            first_name,
            surname,
            nickname
          ),
          display_name,
          cover_image_url,
          address:Addresses(*),
          division:Divisions (
            id,
            name,
            tier,
            district:Districts(id, name)
            )
            )
      `
      )
      .eq('player_id', player.id)
      .eq('status', 'active');

    if (teamPlayerError) {
      throw new Error(teamPlayerError.message);
    }

    teamRoles = await Promise.all(
      (teamPlayerData || []).map(async (tp) => {
        const districtId = tp.team.division?.district?.id;

        const { data: seasonData, error: seasonError } = await supabase
          .from('Seasons')
          .select('id, name, start_date')
          .eq('district', districtId)
          .eq('is_active', true)
          .maybeSingle();

        if (seasonError) throw new Error(seasonError.message);

        return {
          id: tp.id,
          type: 'player',
          role: tp.role,
          teamId: tp.team_id,
          team: tp.team,
          activeSeason: seasonData,
        };
      })
    );
  }

  // Step 3: Fetch District Admin Roles
  const { data: adminData, error: adminError } = await supabase
    .from('DistrictAdmins')
    .select(
      `
      id,
      district_id,
      role,
      district:Districts ( id, name )
      `
    )
    .eq('user_id', player.id);

  if (adminError) {
    throw new Error(adminError.message);
  }

  const adminRoles = await Promise.all(
    (adminData || []).map(async (admin) => {
      const districtId = admin.district_id;

      // Fetch active season for this district
      const { data: seasonData, error: seasonError } = await supabase
        .from('Seasons')
        .select('id, name, start_date')
        .eq('district', districtId)
        .eq('is_active', true)
        .maybeSingle();

      if (seasonError) throw new Error(seasonError.message);

      // Fetch all divisions in this district
      const { data: divisions, error: divisionError } = await supabase
        .from('Divisions')
        .select('id, name')
        .eq('district', districtId)
        .order('tier', { ascending: true });

      if (divisionError) throw new Error(divisionError.message);

      return {
        id: admin.id,
        type: 'admin',
        role: admin.role,
        districtId: admin.district_id,
        district: admin.district,
        activeSeason: seasonData,
        divisions,
      };
    })
  );

  // Step 4: Return combined data
  return {
    user,
    playerProfile: fullPlayerProfile, // add full player profile here
    roles: [...teamRoles, ...adminRoles],
  };
};

export const useAuthUserProfile = () => {
  const { client: supabase } = useSupabaseClient();
  return useQuery({
    queryKey: ['authUserProfile'],
    queryFn: () => fetchAuthUserProfile(supabase),
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
    retry: false,
  });
};
