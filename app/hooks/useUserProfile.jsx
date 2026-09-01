import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ['PlayerProfile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');

      const { data, error } = await supabase
        .from('Players')
        .select(
          `
          *,
          TeamPlayers!TeamPlayers_player_id_fkey (
            *,
            Teams (
              name,
              display_name,
              crest,
              parent_team_id,
              Divisions (
                name,
                Districts (
                  name
                )
              )
            )
          )
        `
        )
        .eq('id', userId)
        .single();

      if (error) throw error;

      const teams =
        data?.TeamPlayers?.map((entry) => {
          const team = entry?.Teams;

          return {
            team_player_id: entry?.id ?? null,
            team_id: entry?.team_id ?? null,
            team_name: team?.name ?? null,
            crest: team?.crest ?? null,
            team_display_name: team?.display_name ?? null,
            parent_team_id: team?.parent_team_id ?? null,
            division_name: team?.Divisions?.name ?? null,
            district_name: team?.Divisions?.Districts?.name ?? null,
            role: entry?.role ?? null,
            status: entry?.status ?? null,
            joined_at: entry?.joined_at ?? null,
            left_at: entry?.left_at ?? null,
            requested_by: entry?.requested_by ?? null,
            requested_at: entry?.requested_at ?? null,
            accepted_by_captain: entry?.accepted_by_captain ?? null,
            accepted_by_admin: entry?.accepted_by_admin ?? null,
            accepted_at_captain: entry?.accepted_at_captain ?? null,
            accepted_at_admin: entry?.accepted_at_admin ?? null,
            invited_by: entry?.invited_by ?? null,
            invited_at: entry?.invited_at ?? null,
          };
        }) ?? [];

      const { TeamPlayers, ...playerData } = data;

      return {
        ...playerData,
        teams,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export default useUserProfile;
