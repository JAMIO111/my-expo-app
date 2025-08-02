import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export default function useUserProfile(userId) {
  const { client: supabase } = useSupabaseClient();
  return useQuery({
    queryKey: ['PlayerProfile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');

      const { data, error } = await supabase
        .from('Players')
        .select(
          `
          *,
          TeamPlayers (
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

      const teamEntry = data?.TeamPlayers?.[0];
      const team = teamEntry?.Teams;

      return {
        ...data,
        team_name: team?.name ?? null,
        team_display_name: team?.display_name ?? null,
        division_name: team?.Divisions?.name ?? null,
        district_name: team?.Divisions?.Districts?.name ?? null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}
