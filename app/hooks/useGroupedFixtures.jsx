import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';

export const useGroupedFixtures = ({ competitionInstanceId, month }) => {
  const fetchGroupedFixtures = async ({ competitionInstanceId, month }) => {
    let query = supabase
      .from('Fixtures')
      .select(
        `
        *,
        home_team:Teams!Fixtures_home_team_fkey(display_name, crest, abbreviation),
        away_team:Teams!Fixtures_away_team_fkey(display_name, crest, abbreviation),
        home_player:Players!Fixtures_home_player_fkey(id, first_name, surname, avatar_url, nickname),
        away_player:Players!Fixtures_away_player_fkey(id, first_name, surname, avatar_url, nickname),
        frames:Results!Results_fixture_id_fkey(*)
      `
      )
      .eq('competition_instance_id', competitionInstanceId) // Only fetch unassigned fixtures
      .eq('approved', false)
      .order('date_time', { ascending: true });

    if (month) {
      const start = startOfMonth(month).toISOString();
      const end = endOfMonth(month).toISOString();
      query = query.gte('date_time', start).lte('date_time', end);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Group fixtures by date
    const grouped = {};
    for (const fixture of data) {
      const key = fixture.date_time.split('T')[0];
      const homeCompetitor =
        fixture.competitor_type === 'team'
          ? { ...fixture.home_team, type: 'team' }
          : {
              ...fixture.home_player,
              type: 'player',
              abbreviation: fixture.home_player?.nickname?.toUpperCase(),
              display_name: `${fixture.home_player?.first_name} ${fixture.home_player?.surname}`,
            };

      const awayCompetitor =
        fixture.competitor_type === 'team'
          ? { ...fixture.away_team, type: 'team' }
          : {
              ...fixture.away_player,
              type: 'player',
              abbreviation: fixture.away_player?.nickname?.toUpperCase(),
              display_name: `${fixture.away_player?.first_name} ${fixture.away_player?.surname}`,
            };

      const fixtureWithCompetitors = {
        ...fixture,
        home_competitor: homeCompetitor,
        away_competitor: awayCompetitor,
        frames: fixture.frames || [],
      };

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(fixtureWithCompetitors);
    }

    return grouped;
  };

  return useQuery({
    queryKey: ['fixtures-grouped', competitionInstanceId, month?.toISOString() ?? null],
    queryFn: () => fetchGroupedFixtures({ competitionInstanceId, month }),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
    enabled: !!competitionInstanceId,
    keepPreviousData: true,
  });
};
