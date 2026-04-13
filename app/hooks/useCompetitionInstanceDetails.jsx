import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCompetitionInstanceDetails(instanceId) {
  return useQuery({
    queryKey: ['CompetitionInstanceDetails', instanceId],
    queryFn: async () => {
      // Supabase allows selecting related tables using foreign key relationships
      const { data, error } = await supabase
        .from('CompetitionInstances')
        .select(
          `
          *,
          CompetitionParticipants(*, player:Players(id, first_name, surname, avatar_url), team:Teams(id, display_name, crest)),
          competition:Competitions(competitor_type, competition_type, district_id),
          division:Divisions(name)
        `
        )
        .eq('id', instanceId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    enabled: !!instanceId, // Only run if instanceId is provided
  });
}
