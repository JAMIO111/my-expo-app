import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useResultsByFixture(fixtureId) {
  return useQuery({
    queryKey: ['ResultsByFixture', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Results')
        .select(
          `
  *,
  home_player:home_player(
    id,
    first_name,
    surname,
    nickname,
    avatar_url
  ),
  away_player:away_player(
    id,
    first_name,
    surname,
    nickname,
    avatar_url
  ),
  winner:winner_id(
    id,
    first_name,
    surname,
    nickname
  )
`
        )
        .eq('fixture_id', fixtureId)
        .order('frame_number', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
