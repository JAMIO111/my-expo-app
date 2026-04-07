import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useStandings(divisionId, seasonId) {
  return useQuery({
    queryKey: ['Standings', divisionId, seasonId],
    enabled: !!divisionId && !!seasonId,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,

    queryFn: async () => {
      if (!divisionId || !seasonId) {
        throw new Error('divisionId and seasonId are required');
      }

      // 1. Division config
      const { data: seasonDivisionData, error: seasonDivisionError } = await supabase
        .from('SeasonDivisions')
        .select('*')
        .eq('division', divisionId)
        .single();

      if (seasonDivisionError) throw seasonDivisionError;

      const competitorType = seasonDivisionData?.competitor_type || 'team';

      // 2. Competitors
      let competitors = [];

      if (competitorType === 'team') {
        const { data, error } = await supabase
          .from('Teams')
          .select('id, display_name, crest')
          .eq('division', divisionId);

        if (error) throw error;

        competitors = data.map((t) => ({
          id: t.id,
          display_name: t.display_name,
          crest: t.crest,
        }));
      } else {
        const { data, error } = await supabase
          .from('Players')
          .select('id, first_name, surname, avatar_url')
          .eq('division', divisionId);

        if (error) throw error;

        competitors = data.map((p) => ({
          id: p.id,
          display_name: `${p.first_name} ${p.surname}`,
          crest: p.avatar_url,
        }));
      }

      // 3. Initialise standings map (ALL start at 0)
      const standingsMap = {};

      competitors.forEach((c) => {
        standingsMap[c.id] = {
          id: c.id,
          display_name: c.display_name,
          crest: c.crest,
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

      // 4. Fixtures
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
        .eq('is_complete', true)
        .eq('approved', true)
        .eq('competitor_type', competitorType);

      if (fixturesError) throw fixturesError;

      const fixtureIds = fixtures.map((f) => f.id);

      // 👉 If NO fixtures → return all 0 standings
      if (!fixtureIds.length) {
        const standings = Object.values(standingsMap)
          .sort((a, b) => a.display_name.localeCompare(b.display_name))
          .map((t, index) => ({
            ...t,
            position: index + 1,
          }));

        return formatResponse(seasonDivisionData, standings);
      }

      // 5. Frames
      const { data: frames, error: framesError } = await supabase
        .from('Results')
        .select('*')
        .in('fixture_id', fixtureIds);

      if (framesError) throw framesError;

      // 6. Group frames by fixture
      const framesByFixture = {};
      frames.forEach((f) => {
        if (!framesByFixture[f.fixture_id]) {
          framesByFixture[f.fixture_id] = [];
        }
        framesByFixture[f.fixture_id].push(f);
      });

      // 7. Apply results
      const scoringSystem = seasonDivisionData?.scoring_system || 'frames_won';

      fixtures.forEach((fixture) => {
        const home = fixture.competitor_type === 'team' ? fixture.home_team : fixture.home_player;

        const away = fixture.competitor_type === 'team' ? fixture.away_team : fixture.away_player;

        if (!home || !away) return;

        const fixtureFrames = framesByFixture[fixture.id] || [];

        let homeFrames = 0;
        let awayFrames = 0;

        fixtureFrames.forEach((fr) => {
          if (fr.winner_side === 'home') homeFrames++;
          if (fr.winner_side === 'away') awayFrames++;
        });

        const homeRow = standingsMap[home.id];
        const awayRow = standingsMap[away.id];

        if (!homeRow || !awayRow) return;

        // basic stats
        homeRow.frames_for += homeFrames;
        homeRow.frames_against += awayFrames;

        awayRow.frames_for += awayFrames;
        awayRow.frames_against += homeFrames;

        homeRow.played++;
        awayRow.played++;

        // scoring systems
        if (scoringSystem === 'points') {
          const win = seasonDivisionData?.points_for_win ?? 3;
          const draw = seasonDivisionData?.points_for_draw ?? 1;
          const loss = seasonDivisionData?.points_for_loss ?? 0;

          if (homeFrames > awayFrames) {
            homeRow.won++;
            awayRow.lost++;
            homeRow.points += win;
            awayRow.points += loss;
          } else if (awayFrames > homeFrames) {
            awayRow.won++;
            homeRow.lost++;
            awayRow.points += win;
            homeRow.points += loss;
          } else {
            homeRow.drawn++;
            awayRow.drawn++;
            homeRow.points += draw;
            awayRow.points += draw;
          }
        } else if (scoringSystem === 'frames_won') {
          homeRow.points += homeFrames;
          awayRow.points += awayFrames;

          if (homeFrames > awayFrames) {
            homeRow.won++;
            awayRow.lost++;
          } else if (awayFrames > homeFrames) {
            awayRow.won++;
            homeRow.lost++;
          } else {
            homeRow.drawn++;
            awayRow.drawn++;
          }
        } else if (scoringSystem === 'frame_diff') {
          const diff = Math.abs(homeFrames - awayFrames);

          if (homeFrames > awayFrames) {
            homeRow.points += diff;
            homeRow.won++;
            awayRow.lost++;
          } else if (awayFrames > homeFrames) {
            awayRow.points += diff;
            awayRow.won++;
            homeRow.lost++;
          } else {
            homeRow.drawn++;
            awayRow.drawn++;
          }
        }
      });

      // 8. Finalise standings
      const standings = Object.values(standingsMap).map((t) => ({
        ...t,
        frame_diff: t.frames_for - t.frames_against,
      }));

      // 9. Sort
      const sorted = standings
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.frame_diff !== a.frame_diff) return b.frame_diff - a.frame_diff;
          if (b.frames_for !== a.frames_for) return b.frames_for - a.frames_for;

          return a.display_name.localeCompare(b.display_name);
        })
        .map((t, index) => ({
          ...t,
          position: index + 1,
        }));

      return formatResponse(seasonDivisionData, sorted);
    },
  });
}

// helper to keep things clean
function formatResponse(division, standings) {
  return {
    division: {
      id: division?.division,
      name: division?.division_name,
      promotion_spots: division?.promotion_spots,
      relegation_spots: division?.relegation_spots,
      special_match: division?.special_match,
      draws_allowed: division?.draws_allowed,
      scoring_system: division?.scoring_system,
      points_for_win: division?.points_for_win,
      points_for_draw: division?.points_for_draw,
      points_for_loss: division?.points_for_loss,
    },
    standings,
  };
}
