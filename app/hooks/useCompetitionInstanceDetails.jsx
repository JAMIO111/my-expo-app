import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCompetitionInstanceDetails(instanceId) {
  return useQuery({
    queryKey: ['CompetitionInstanceDetails', instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('CompetitionInstances')
        .select(
          `
          *,
          CompetitionParticipants(*, player:Players(id, first_name, surname, avatar_url), team:Teams(id, display_name, crest, parent_team_id)),
          competition:Competitions(competitor_type, competition_type, district_id),
          division:Divisions(name)
        `
        )
        .eq('id', instanceId)
        .single();

      if (error) {
        console.error('CompetitionInstanceDetails error:', JSON.stringify(error, null, 2));
        throw error;
      }

      const parentTeamIds = [
        ...new Set(
          (data?.CompetitionParticipants ?? []).map((p) => p.team?.parent_team_id).filter(Boolean)
        ),
      ];

      if (parentTeamIds.length > 0) {
        const { data: parentTeams, error: parentTeamsError } = await supabase
          .from('Teams')
          .select('id, display_name, crest, abbreviation')
          .in('id', parentTeamIds);

        if (parentTeamsError) {
          console.error('Parent teams fetch error:', JSON.stringify(parentTeamsError, null, 2));
          throw parentTeamsError;
        }

        const parentTeamsById = Object.fromEntries(parentTeams.map((t) => [t.id, t]));

        data.CompetitionParticipants = data.CompetitionParticipants.map((p) => {
          if (!p.team) return p;

          const parentTeam = parentTeamsById[p.team.parent_team_id] ?? null;

          return {
            ...p,
            team: {
              ...p.team,
              parent_team: parentTeam,
              crest: parentTeam ? parentTeam.crest : p.team.crest,
            },
          };
        });
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!instanceId, // Only run if instanceId is provided
  });
}

export default useCompetitionInstanceDetails;
