import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useStandings(divisionId, seasonId) {
  return useQuery({
    queryKey: ['Standings', divisionId, seasonId],
    queryFn: async () => {
      if (!divisionId || !seasonId) throw new Error('divisionId and seasonId is required');

      const { data, error } = await supabase
        .from('Standings')
        .select('*, Teams!Standings_team_fkey(id, display_name, crest)')
        .eq('division', divisionId)
        .eq('season', seasonId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!divisionId && !!seasonId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}
