import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useResultsByFixture(fixtureId) {
  return useQuery({
    queryKey: ['ResultsByFixture', fixtureId],
    queryFn: async () => {
      if (!fixtureId) throw new Error('fixtureId is required');

      const { data: frames, error } = await supabase
        .from('Results')
        .select(
          `
          *,
          home_player_1:Players!Results_home_player_1_fkey(id, first_name, surname, nickname, avatar_url),
          home_player_2:Players!Results_home_player_2_fkey(id, first_name, surname, nickname, avatar_url),
          away_player_1:Players!Results_away_player_1_fkey(id, first_name, surname, nickname, avatar_url),
          away_player_2:Players!Results_away_player_2_fkey(id, first_name, surname, nickname, avatar_url)
        `
        )
        .eq('fixture_id', fixtureId)
        .order('frame_number', { ascending: true });

      if (error) {
        console.error('Supabase Query Error:', error.message);
        throw error;
      }

      if (!frames) return [];

      return frames.map((frame) => ({
        ...frame,
        homeCompetitor: [frame.home_player_1, frame.home_player_2].filter(Boolean),
        awayCompetitor: [frame.away_player_1, frame.away_player_2].filter(Boolean),
      }));
    },
    enabled: !!fixtureId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 30 minutes
  });
}
