// hooks/useUpcomingFixtures.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useUpcomingFixtures = (competitorId, competitorType, seasonId) => {
  const fetchUpcomingFixtures = async (competitorId, competitorType, seasonId) => {
    if (!competitorId) throw new Error('Competitor ID is required');
    if (!seasonId) throw new Error('Season ID is required');

    let query = supabase
      .from('Fixtures')
      .select(
        `
        *,
        homeTeam:Teams!Fixtures_home_team_fkey(id, display_name, abbreviation, crest),
        awayTeam:Teams!Fixtures_away_team_fkey(id, display_name, abbreviation, crest),
        homePlayer:Players!Fixtures_home_player_fkey(id, first_name, surname, nickname, avatar_url),
        awayPlayer:Players!Fixtures_away_player_fkey(id, first_name, surname, nickname, avatar_url)
      `
      )
      .eq('season', seasonId)
      .order('date_time', { ascending: true });

    if (competitorType === 'team') {
      query = query.or(`home_team.eq.${competitorId},away_team.eq.${competitorId}`);
    } else if (competitorType === 'player') {
      query = query.or(`home_player.eq.${competitorId},away_player.eq.${competitorId}`);
    } else {
      throw new Error('Invalid competitor type');
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message || 'Failed to fetch upcoming fixtures');

    return data.map((fixture) => ({
      ...fixture,
      date: new Date(fixture.date_time),
      homeTeam: {
        ...fixture.homeTeam,
        abbreviation: fixture.homeTeam?.abbreviation || 'N/A',
      },
      awayTeam: {
        ...fixture.awayTeam,
        abbreviation: fixture.awayTeam?.abbreviation || 'N/A',
      },
      homePlayer: {
        ...fixture.homePlayer,
        nickname: fixture.homePlayer?.nickname || 'N/A',
      },
      awayPlayer: {
        ...fixture.awayPlayer,
        nickname: fixture.awayPlayer?.nickname || 'N/A',
      },
    }));
  };

  return useQuery({
    queryKey: ['upcoming-fixtures', competitorId, competitorType, seasonId],
    queryFn: () => fetchUpcomingFixtures(competitorId, competitorType, seasonId),
    enabled: !!competitorId && !!competitorType && !!seasonId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
