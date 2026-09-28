import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function useCompetitionSponsor(competitionInstanceId) {
  return useQuery({
    queryKey: ['competition-sponsor', competitionInstanceId],
    enabled: !!competitionInstanceId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    queryFn: async () => {
      const { data, error } = await supabase
        .from('CompetitionInstanceSponsors')
        .select('id, is_paid, sponsor:Sponsors(id, name, logo_url, website_url)')
        .eq('competition_instance_id', competitionInstanceId)
        .eq('is_paid', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}
