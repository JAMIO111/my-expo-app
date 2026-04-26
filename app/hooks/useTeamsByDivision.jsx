import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useTeamsByDivision = (divisionId) => {
  const fetchTeamsByDivision = async (divisionId) => {
    if (!divisionId) throw new Error('Division ID is required');

    const { data, error } = await supabase
      .from('DivisionMembers')
      .select(
        `
        id,
        team_id,
        status,
        joined_at,
        Teams (
          id,
          name,
          display_name,
          crest,
          abbreviation,
          district,
          captain,
          vice_captain
        )
      `
      )
      .eq('division_id', divisionId)
      .eq('status', 'active')
      .not('team_id', 'is', null)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    // flatten to just teams if that’s what your UI expects
    return data.map((row) => ({
      ...row.Teams,
      joined_at: row.joined_at,
    }));
  };

  return useQuery({
    queryKey: ['division-teams', divisionId],
    queryFn: () => fetchTeamsByDivision(divisionId),
    enabled: !!divisionId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
