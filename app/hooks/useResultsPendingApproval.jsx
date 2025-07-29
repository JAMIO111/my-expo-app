import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useResultsPendingApproval({ awayTeamId, enabled = true }) {
  return useQuery({
    queryKey: ['ResultsPendingApproval', awayTeamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Fixtures')
        .select(
          '*, home_team:Teams!Fixtures_home_team_fkey(display_name, crest, abbreviation), away_team:Teams!Fixtures_away_team_fkey(display_name,crest, abbreviation)'
        )
        .eq('away_team', awayTeamId)
        .eq('approved', false)
        .eq('is_complete', true);

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!awayTeamId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
