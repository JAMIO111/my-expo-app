import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useFixturesAwaitingResults({
  competitorId,
  competitorType, // 'team' | 'player'
  type, // 'amended' | 'disputed' | 'pendingApproval' | 'awaitingResults'
  enabled = true,
}) {
  return useQuery({
    queryKey: ['FixturesAwaitingResults', type, competitorId, competitorType],
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
        .eq('is_escalated', false);

      // 🧠 Apply type-based filters
      switch (type) {
        case 'amended':
          query = query
            .eq('approved', false)
            .eq('is_complete', true)
            .eq('is_disputed', true)
            .eq('is_amended', true);
          break;

        case 'disputed':
          query = query
            .eq('approved', false)
            .eq('is_complete', true)
            .eq('is_disputed', true)
            .eq('is_amended', false);
          break;

        case 'pendingApproval':
          query = query
            .eq('approved', false)
            .eq('is_complete', true)
            .eq('is_disputed', false)
            .eq('is_amended', false);
          break;

        case 'awaitingResults':
          query = query
            .lte('date_time', new Date().toISOString())
            .eq('approved', false)
            .eq('is_complete', false);
          break;

        default:
          throw new Error('Invalid fixture type');
      }

      // 🎯 Competitor filtering (THIS is where yours was inconsistent)
      if (competitorType === 'team') {
        if (type === 'pendingApproval' || type === 'amended') {
          query = query.eq('away_team', competitorId);
        } else {
          query = query.eq('home_team', competitorId);
        }
      } else if (competitorType === 'player') {
        if (type === 'pendingApproval' || type === 'amended') {
          query = query.eq('away_player', competitorId);
        } else {
          query = query.eq('home_player', competitorId);
        }
      } else {
        throw new Error('Invalid competitorType');
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },
    enabled: enabled && !!competitorId && !!competitorType && !!type,
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
