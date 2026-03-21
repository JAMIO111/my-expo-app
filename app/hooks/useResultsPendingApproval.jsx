import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useResultsPendingApproval({
  competitorId,
  competitorType, // 'team' | 'player'
  enabled = true,
}) {
  return useQuery({
    queryKey: ['ResultsPendingApproval', competitorId, competitorType],
    queryFn: async () => {
      let query = supabase
        .from('Fixtures')
        .select(
          `*,
          home_team:Teams!Fixtures_home_team_fkey(display_name, crest, abbreviation),
          away_team:Teams!Fixtures_away_team_fkey(display_name, crest, abbreviation),
          home_player:Players!Fixtures_home_player_fkey(id, first_name, surname, nickname, avatar_url),
          away_player:Players!Fixtures_away_player_fkey(id, first_name, surname, nickname, avatar_url),
          competition_instance:CompetitionInstances!Fixtures_competition_instance_id_fkey(id, name)`
        )
        .eq('approved', false)
        .eq('is_complete', true);

      // Apply filter based on competitor type
      if (competitorType === 'team') {
        query = query.eq('away_team', competitorId);
      } else if (competitorType === 'player') {
        query = query.eq('away_player', competitorId);
      } else {
        throw new Error('Invalid competitorType');
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Results pending approval:', data);
      return data;
    },
    enabled: enabled && !!competitorId && !!competitorType,
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
