import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useResultsByFixture(fixtureId) {
  return useQuery({
    queryKey: ['ResultsByFixture', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Results')
        .select('*')
        .eq('fixture_id', fixtureId)
        .order('frame_number', { ascending: true }); // optional: sort by frame

      if (error) throw error;
      return data;
    },
    enabled: !!fixtureId, // only run when fixtureId is defined
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
