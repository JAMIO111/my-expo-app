import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useStandingsLive(divisionId, seasonId) {
  return useQuery({
    queryKey: ['StandingsLive', divisionId, seasonId],
    queryFn: async () => {
      if (!divisionId || !seasonId) throw new Error('divisionId and seasonId are required');

      // 1. Division config
      const { data: seasonDivisionData, error: seasonDivisionError } = await supabase
        .from('SeasonDivisions')
        .select('*')
        .eq('division', divisionId)
        .single();
      if (seasonDivisionError) throw seasonDivisionError;

      // 2. Teams
      const { data: teams, error: teamsError } = await supabase
        .from('Teams')
        .select('id, display_name, crest')
        .eq('division', divisionId);
      if (teamsError) throw teamsError;

      // 3. Fixtures
      const { data: fixtures, error: fixturesError } = await supabase
        .from('Fixtures')
        .select(
          `
          id,
          competitor_type,
          home_team(id, display_name, crest),
          away_team(id, display_name, crest),
          home_player(id, first_name, surname),
          away_player(id, first_name, surname)
        `
        )
        .eq('division', divisionId)
        .eq('season', seasonId)
        .eq('is_complete', true);
      if (fixturesError) throw fixturesError;

      const fixtureIds = fixtures.map((f) => f.id);
      if (!fixtureIds.length) return { division: seasonDivisionData, standings: [] };

      // 4. Frames
      const { data: frames, error: framesError } = await supabase
        .from('Results')
        .select('*')
        .in('fixture_id', fixtureIds);
      if (framesError) throw framesError;

      // 5. Pre-index frames by fixture
      const framesByFixture = {};
      frames.forEach((f) => {
        if (!framesByFixture[f.fixture_id]) framesByFixture[f.fixture_id] = [];
        framesByFixture[f.fixture_id].push(f);
      });

      // 6. Initialise standings
      const standingsMap = {};
      teams.forEach((team) => {
        standingsMap[team.id] = {
          id: team.id,
          display_name: team.display_name,
          crest: team.crest,
          played: 0,
          won: 0,
          lost: 0,
          drawn: 0,
          points: 0,
          frames_for: 0,
          frames_against: 0,
          frame_diff: 0,
        };
      });

      // 7. Apply fixture results
      fixtures.forEach((fixture) => {
        const home = fixture.competitor_type === 'team' ? fixture.home_team : fixture.home_player;
        const away = fixture.competitor_type === 'team' ? fixture.away_team : fixture.away_player;
        if (!home || !away) return;

        const fixtureFrames = framesByFixture[fixture.id] || [];
        let homeFrames = 0;
        let awayFrames = 0;

        fixtureFrames.forEach((fr) => {
          if (!fr.winner_side) return;

          // Increment frame counts based on winner_side
          if (fr.winner_side === 'home') homeFrames++;
          else if (fr.winner_side === 'away') awayFrames++;
        });

        standingsMap[home.id].frames_for += homeFrames;
        standingsMap[home.id].frames_against += awayFrames;

        standingsMap[away.id].frames_for += awayFrames;
        standingsMap[away.id].frames_against += homeFrames;

        standingsMap[home.id].played += 1;
        standingsMap[away.id].played += 1;

        const scoringSystem = seasonDivisionData?.scoring_system || 'frames_won';

        // POINTS SYSTEM
        if (scoringSystem === 'points') {
          const win = seasonDivisionData?.points_for_win ?? 3;
          const draw = seasonDivisionData?.points_for_draw ?? 1;
          const loss = seasonDivisionData?.points_for_loss ?? 0;

          if (homeFrames > awayFrames) {
            standingsMap[home.id].won++;
            standingsMap[away.id].lost++;
            standingsMap[home.id].points += win;
            standingsMap[away.id].points += loss;
          } else if (awayFrames > homeFrames) {
            standingsMap[away.id].won++;
            standingsMap[home.id].lost++;
            standingsMap[away.id].points += win;
            standingsMap[home.id].points += loss;
          } else {
            standingsMap[home.id].drawn++;
            standingsMap[away.id].drawn++;
            standingsMap[home.id].points += draw;
            standingsMap[away.id].points += draw;
          }
        }

        // FRAMES WON SYSTEM
        else if (scoringSystem === 'frames_won') {
          standingsMap[home.id].points += homeFrames;
          standingsMap[away.id].points += awayFrames;

          if (homeFrames > awayFrames) {
            standingsMap[home.id].won++;
            standingsMap[away.id].lost++;
          } else if (awayFrames > homeFrames) {
            standingsMap[away.id].won++;
            standingsMap[home.id].lost++;
          } else {
            standingsMap[home.id].drawn++;
            standingsMap[away.id].drawn++;
          }
        }

        // FRAME DIFFERENCE SYSTEM
        else if (scoringSystem === 'frame_diff') {
          const diff = Math.abs(homeFrames - awayFrames);

          if (homeFrames > awayFrames) {
            standingsMap[home.id].points += diff;
            standingsMap[home.id].won++;
            standingsMap[away.id].lost++;
          } else if (awayFrames > homeFrames) {
            standingsMap[away.id].points += diff;
            standingsMap[away.id].won++;
            standingsMap[home.id].lost++;
          } else {
            standingsMap[home.id].drawn++;
            standingsMap[away.id].drawn++;
          }
        }
      });

      // 8. Compute frame_diff
      const standings = Object.values(standingsMap).map((t) => ({
        ...t,
        frame_diff: t.frames_for - t.frames_against,
      }));

      // 9. Sorting
      const sortOrder = ['points', 'won', 'frames_diff'];
      const sortedStandings = standings.sort((a, b) => {
        for (const key of sortOrder) if (b[key] !== a[key]) return b[key] - a[key];
        return 0;
      });

      return {
        division: {
          id: seasonDivisionData?.division,
          name: seasonDivisionData?.division_name,
          promotion_spots: seasonDivisionData?.promotion_spots,
          relegation_spots: seasonDivisionData?.relegation_spots,
          special_match: seasonDivisionData?.special_match,
          draws_allowed: seasonDivisionData?.draws_allowed,
          scoring_system: seasonDivisionData?.scoring_system,
          points_for_win: seasonDivisionData?.points_for_win,
          points_for_draw: seasonDivisionData?.points_for_draw,
          points_for_loss: seasonDivisionData?.points_for_loss,
        },
        standings: sortedStandings,
      };
    },
    enabled: !!divisionId && !!seasonId,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
