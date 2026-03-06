// hooks/useUpcomingFixtures.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useFixtureDetails = (fixtureId) => {
  const fetchFixtureDetails = async (fixtureId) => {
    if (!fixtureId) throw new Error('Fixture ID is required');

    // 1. Fixture details with team info
    const { data, error } = await supabase
      .from('Fixtures')
      .select(
        `
        *,
        homeTeam:Teams!Fixtures_home_team_fkey(
          id,
          display_name,
          abbreviation,
          crest,
          address:Addresses!Teams_address_fkey(
            id,
            line_1,
            line_2,
            city,
            postcode
          )
        ),
        awayTeam:Teams!Fixtures_away_team_fkey(
          id,
          display_name,
          abbreviation,
          crest
        ),
        homePlayer:Players!Fixtures_home_player_fkey(id, first_name, surname, avatar_url, nickname),
        awayPlayer:Players!Fixtures_away_player_fkey(id, first_name, surname, avatar_url, nickname)
      `
      )
      .eq('id', fixtureId)
      .single();

    if (error) throw new Error(error.message || 'Failed to fetch fixture details');

    // 2. Fetch frames for this fixture
    const { data: frames, error: framesError } = await supabase
      .from('Results')
      .select('*')
      .eq('fixture_id', fixtureId);

    if (framesError) throw new Error(framesError.message || 'Failed to fetch fixture frames');

    return {
      ...data,
      date: new Date(data.date_time),
      address: data.homeTeam?.address,
      homeCompetitor:
        data.competitor_type === 'team'
          ? { ...data.homeTeam, type: 'team' }
          : {
              ...data.homePlayer,
              type: 'player',
              display_name: `${data.homePlayer.first_name} ${data.homePlayer.surname}`,
            },
      awayCompetitor:
        data.competitor_type === 'team'
          ? { ...data.awayTeam, type: 'team' }
          : {
              ...data.awayPlayer,
              type: 'player',
              display_name: `${data.awayPlayer.first_name} ${data.awayPlayer.surname}`,
            },
      frames: frames || [],
    };
  };

  return useQuery({
    queryKey: ['fixture-details', fixtureId],
    queryFn: () => fetchFixtureDetails(fixtureId),
    enabled: !!fixtureId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
