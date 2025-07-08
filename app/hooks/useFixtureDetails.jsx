// hooks/useUpcomingFixtures.js
import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

const fetchFixtureDetails = async (fixtureId) => {
  if (!fixtureId) throw new Error('Fixture ID is required');

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
        )
      `
    )
    .eq('id', fixtureId)
    .single();

  if (error) throw new Error(error.message || 'Failed to fetch fixture details');

  return {
    ...data,
    date: new Date(data.date_time),
    homeTeam: {
      ...data.homeTeam,
      abbreviation: data.homeTeam.abbreviation || 'N/A',
      address: data.homeTeam.address || null,
    },
    awayTeam: {
      ...data.awayTeam,
      abbreviation: data.awayTeam.abbreviation || 'N/A',
    },
  };
};

export const useFixtureDetails = (fixtureId) => {
  return useQuery({
    queryKey: ['fixture-details', fixtureId],
    queryFn: () => fetchFixtureDetails(fixtureId),
    enabled: !!fixtureId, // Only run query if fixtureId is defined
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
