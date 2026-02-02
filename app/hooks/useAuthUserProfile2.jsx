import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const fetchAuthUserProfile = async () => {
  // Auth is already hydrated at this point
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // --- Player lookup ---
  const { data: player } = await supabase
    .from('Players')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();

  let fullPlayerProfile = null;
  let teamRoles = [];

  if (player) {
    const { data: playerData } = await supabase
      .from('Players')
      .select('*')
      .eq('id', player.id)
      .single();

    fullPlayerProfile = playerData;

    const { data: teamPlayerData } = await supabase
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

    teamRoles = await Promise.all(
      (teamPlayerData || []).map(async (tp) => {
        const districtId = tp.team.division?.district?.id;

        const { data: seasonData } = await supabase
          .from('Seasons')
          .select('id, name, start_date')
          .eq('district', districtId)
          .eq('is_active', true)
          .maybeSingle();

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

  // --- District admin roles ---
  const { data: adminData } = await supabase
    .from('DistrictAdmins')
    .select(
      `
      id,
      district_id,
      role,
      district:Districts ( id, name )
      `
    )
    .eq('user_id', player?.id);

  const adminRoles = await Promise.all(
    (adminData || []).map(async (admin) => {
      const { data: seasonData } = await supabase
        .from('Seasons')
        .select('id, name, start_date')
        .eq('district', admin.district_id)
        .eq('is_active', true)
        .maybeSingle();

      const { data: divisions } = await supabase
        .from('Divisions')
        .select('id, name')
        .eq('district', admin.district_id)
        .order('tier', { ascending: true });

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

  return {
    user,
    playerProfile: fullPlayerProfile,
    roles: [...teamRoles, ...adminRoles],
  };
};

export const useAuthUserProfile = () => {
  const { session, loading } = useAuth();

  return useQuery({
    queryKey: ['authUserProfile'],
    queryFn: fetchAuthUserProfile,
    enabled: !!session && !loading,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
    retry: false,
  });
};
