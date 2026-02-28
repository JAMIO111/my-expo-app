import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function useUserProfile(userId) {
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
            role,
            status,
            joined_at,
            left_at,
            team_id,
            Teams (
              name,
              display_name,
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
            team_id: entry?.team_id ?? null,
            team_name: team?.name ?? null,
            team_display_name: team?.display_name ?? null,
            division_name: team?.Divisions?.name ?? null,
            district_name: team?.Divisions?.Districts?.name ?? null,
            role: entry?.role ?? null,
            status: entry?.status ?? null,
            joined_at: entry?.joined_at ?? null,
            left_at: entry?.left_at ?? null,
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
    cacheTime: 30 * 60 * 1000,
  });
}
