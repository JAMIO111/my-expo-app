import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useFixturesAwaitingResults({ homeTeamId, enabled = true }) {
  return useQuery({
    queryKey: ['FixturesAwaitingResults', homeTeamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Fixtures')
        .select(
          '*, home_team:Teams!Fixtures_home_team_fkey(display_name, crest, abbreviation), away_team:Teams!Fixtures_away_team_fkey(display_name,crest, abbreviation)'
        )
        .eq('home_team', homeTeamId)
        .lte('date_time', new Date().toISOString())
        .eq('approved', false);

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!homeTeamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
