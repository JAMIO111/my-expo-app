import supabase from '@/lib/supabaseClient';

export const isBirthdayToday = (dob) => {
  if (!dob) return false;

  const today = new Date();
  const birthDate = new Date(dob);

  return birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth();
};

export function getSeasonLabel(seasonStartDay, seasonStartMonth, seasonEndDay, seasonEndMonth) {
  const now = new Date();

  // Helper to make date (month is 1-based)
  const makeDate = (year, month, day) => new Date(year, month - 1, day);

  // Determine current season start year
  // If today is before August 1, then season started previous year
  const currentYear = now.getFullYear();
  const seasonStartThisYear = makeDate(currentYear, seasonStartMonth, seasonStartDay);

  let seasonStartYear;
  if (now >= seasonStartThisYear) {
    // Date is after or on August 1, so season started this year
    seasonStartYear = currentYear;
  } else {
    // Date is before August 1, so season started last year
    seasonStartYear = currentYear - 1;
  }

  // Season start and end dates for this season
  const seasonStartDate = makeDate(seasonStartYear, seasonStartMonth, seasonStartDay);
  const seasonEndDate = makeDate(seasonStartYear + 1, seasonEndMonth, seasonEndDay);

  // Next season start (Aug 1 of next year)
  const nextSeasonStartDate = makeDate(seasonStartYear + 1, seasonStartMonth, seasonStartDay);

  // Midpoint between season end and next season start (mid-July)
  const midpoint = new Date((seasonEndDate.getTime() + nextSeasonStartDate.getTime()) / 2);

  // Logic:
  // - if today is before midpoint => current season label
  // - if today is on or after midpoint => next season label

  if (now < midpoint) {
    // Current season label e.g. "2025/26"
    const startYear = seasonStartYear;
    const endYearShort = String(seasonStartYear + 1).slice(-2);
    return `${startYear}/${endYearShort}`;
  } else {
    // Next season label e.g. "2026/27"
    const nextStartYear = seasonStartYear + 1;
    const nextEndYearShort = String(nextStartYear + 1).slice(-2);
    return `${nextStartYear}/${nextEndYearShort}`;
  }
}

export function getAgeInYearsAndDays(dob) {
  const birthDate = new Date(dob);
  const now = new Date();

  // Calculate difference in total milliseconds
  const diffTime = now - birthDate;

  // Convert total difference into days
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate years and remaining days
  const years = Math.floor(totalDays / 365.25); // Account for leap years
  const days = Math.floor(totalDays - years * 365.25);

  return { years, days };
}

import {
  parseISO,
  addWeeks,
  format,
  nextDay,
  getDay,
  differenceInCalendarWeeks,
  setHours,
  setMinutes,
  isWithinInterval,
} from 'date-fns';

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function generateFixtures({
  teams,
  startDate,
  matchDays,
  reverseGapWeeks = 4,
  time = '20:00',
  divisionId,
  seasonId,
  excludedRanges = [],
}) {
  if (teams.length % 2 !== 0) teams.push('BYE');

  const matchDayIndexes = matchDays.map((day) =>
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day)
  );

  const totalRounds = teams.length - 1;
  const half = teams.length / 2;
  let rotated = [...teams];
  const rounds = [];

  for (let round = 0; round < totalRounds; round++) {
    const matches = [];
    for (let i = 0; i < half; i++) {
      const home = rotated[i];
      const away = rotated[teams.length - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') {
        matches.push({ home, away });
      }
    }
    rotated = [rotated[0], ...rotated.slice(-1), ...rotated.slice(1, -1)];
    rounds.push(matches);
  }

  const firstLeg = rounds.flat();
  const secondLeg = shuffle(firstLeg.map(({ home, away }) => ({ home: away, away: home })));
  const allMatches = [...firstLeg, ...secondLeg];

  const firstMatchDates = new Map();
  const fixtures = [];
  let currentDate = typeof startDate === 'string' ? parseISO(startDate) : startDate;

  const [hour, minute] = time.split(':').map(Number);

  // Helper: check if a given date falls in any excluded range
  const isInExcludedRange = (date) => {
    return excludedRanges.some(({ start, end }) => {
      const startDate = typeof start === 'string' ? parseISO(start) : start;
      const endDate = typeof end === 'string' ? parseISO(end) : end;
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  while (allMatches.length > 0) {
    // Skip entire week if it includes an excluded match day
    const shouldSkipWeek = matchDayIndexes.some((dayIndex) => {
      const possibleMatchDate =
        getDay(currentDate) === dayIndex ? currentDate : nextDay(currentDate, dayIndex);
      return isInExcludedRange(possibleMatchDate);
    });

    if (shouldSkipWeek) {
      currentDate = addWeeks(currentDate, 1);
      continue;
    }

    for (let dayIndex of matchDayIndexes) {
      let matchDate = currentDate;
      if (getDay(currentDate) !== dayIndex) {
        matchDate = nextDay(currentDate, dayIndex);
      }

      if (isInExcludedRange(matchDate)) continue;

      const teamsPlayingToday = new Set();
      let gamesToday = 0;
      const maxGames = teams.length / 2;

      for (let i = 0; i < allMatches.length && gamesToday < maxGames; ) {
        const match = allMatches[i];
        const { home, away } = match;
        const key = `${away}-${home}`;

        if (firstMatchDates.has(key)) {
          const originalDate = parseISO(firstMatchDates.get(key));
          const weekDiff = differenceInCalendarWeeks(matchDate, originalDate);
          if (weekDiff < reverseGapWeeks) {
            i++;
            continue;
          }
        }

        if (teamsPlayingToday.has(home) || teamsPlayingToday.has(away)) {
          i++;
          continue;
        }

        const matchDateTime = setMinutes(setHours(matchDate, hour), minute);

        fixtures.push({
          home_team: home,
          away_team: away,
          date_time: matchDateTime.toISOString(),
          season: seasonId,
          division: divisionId,
        });

        if (!firstMatchDates.has(`${home}-${away}`)) {
          firstMatchDates.set(`${home}-${away}`, format(matchDateTime, 'yyyy-MM-dd'));
        }

        teamsPlayingToday.add(home);
        teamsPlayingToday.add(away);
        allMatches.splice(i, 1);
        gamesToday++;
      }
    }

    currentDate = addWeeks(currentDate, 1);
  }

  console.log('Generated Fixtures:', fixtures);
  return fixtures;
}

export const endSeason = async (districtId) => {
  const { data: currentSeason } = await supabase
    .from('Seasons')
    .select('*')
    .eq('district', districtId)
    .eq('is_active', true)
    .single();
  if (!currentSeason) {
    console.error('No active season found for district:', districtId);
    return;
  }
  const { data: divisions } = await supabase
    .from('Divisions')
    .select('*')
    .eq('district', districtId)
    .order('tier', { ascending: true });

  for (let i = 0; i < divisions.length; i++) {
    const currentDivision = divisions[i];

    // Relegate bottom 3 (unless bottom Division)
    if (i < divisions.length - 1) {
      const { data: bottomTeams } = await supabase
        .from('Standings')
        .select('team')
        .eq('division', currentDivision.id)
        .eq('season', currentSeason.id)
        .order('position', { ascending: false })
        .limit(3);

      for (const { team } of bottomTeams) {
        await supabase
          .from('Teams')
          .update({ division: divisions[i + 1].id })
          .eq('id', team);
      }
    }

    // Promote top 3 (unless top Division)
    if (i > 0) {
      const { data: topTeams } = await supabase
        .from('Standings')
        .select('team')
        .eq('division', currentDivision.id)
        .eq('season', currentSeason.id)
        .order('position', { ascending: true })
        .limit(3);

      for (const { team } of topTeams) {
        await supabase
          .from('Teams')
          .update({ division: divisions[i - 1].id })
          .eq('id', team);
      }
    }
  }

  console.log('Promotion and relegation completed!');
};

function recalculatePositions(teams) {
  if (!Array.isArray(teams)) return [];

  const sortedTeams = [...teams].sort((a, b) => {
    const aPlayed = a.Played || 0;
    const bPlayed = b.Played || 0;

    // If both teams haven't played, sort alphabetically
    if (aPlayed === 0 && bPlayed === 0) {
      return a.Team.localeCompare(b.Team);
    }

    // Sort by Points (desc), then Won (desc)
    if (b.Points !== a.Points) return b.Points - a.Points;
    if (b.Won !== a.Won) return b.Won - a.Won;

    // As fallback, sort alphabetically
    return a.Team.localeCompare(b.Team);
  });

  sortedTeams.forEach((team, index) => {
    team.position = index + 1;
  });

  return sortedTeams;
}

export async function initiateNewSeason(seasonName, districtId) {
  console.log(`Creating new season: ${seasonName} for district ${districtId}`);

  // 1. Create new season
  const { data: season, error: seasonError } = await supabase
    .from('Seasons')
    .insert({
      name: seasonName,
      district: districtId,
      start_date: new Date().toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (seasonError) {
    console.error('❌ Error creating season:', seasonError);
    return;
  }

  const seasonId = season.id;

  // 2. Get all active divisions
  const { data: divisions, error: divisionError } = await supabase
    .from('Divisions')
    .select('id')
    .eq('district', districtId);

  if (divisionError) {
    console.error('❌ Error fetching divisions:', divisionError);
    return;
  }

  for (const division of divisions) {
    // 3. Get teams in each division
    const { data: teams, error: teamError } = await supabase
      .from('Teams')
      .select('id')
      .eq('division', division.id);

    if (teamError) {
      console.error(`❌ Error fetching teams for division ${division.id}:`, teamError);
      continue;
    }

    // 4. Create standings row for each team
    const rowsToInsert = teams.map((team) => ({
      team: team.id,
      division: division.id,
      season: seasonId,
      played: 0,
      points: 0,
      won: 0,
      lost: 0,
      position: null, // to be calculated later
    }));

    const { error: standingsError } = await supabase.from('Standings').insert(rowsToInsert);

    if (standingsError) {
      console.error(`❌ Error creating standings for division ${division.id}:`, standingsError);
      continue;
    }
  }

  // 5. Recalculate and update positions
  for (const division of divisions) {
    const { data: standings, error: standingsFetchError } = await supabase
      .from('Standings')
      .select('id, team, played, points, won, lost, Teams(display_name)')
      .eq('division', division.id)
      .eq('season', seasonId);

    if (standingsFetchError || !standings) {
      console.error(
        `❌ Error fetching standings for division ${division.id}:`,
        standingsFetchError
      );
      continue;
    }

    // Add team display names (required for sorting)
    const standingsWithNames = standings.map((entry) => ({
      ...entry,
      Team: entry.Teams?.display_name ?? '', // for alphabetical fallback
    }));

    const sortedStandings = recalculatePositions(standingsWithNames);

    for (const team of sortedStandings) {
      const { error: updateError } = await supabase
        .from('Standings')
        .update({ position: team.position })
        .eq('id', team.id);

      if (updateError) {
        console.error(`❌ Failed to update position for team ${team.id}:`, updateError);
      }
    }
  }
  console.log(`✅ Season "${seasonName}" created and standings initialized.`);

  return seasonId;
}

export async function getActiveSeason(districtId) {
  const { data, error } = await supabase
    .from('Seasons')
    .select('*')
    .eq('district', districtId)
    .eq('is_active', true); // or whatever your active flag is

  if (error) {
    console.error('Error fetching active season:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn('No active season found for district', districtId);
    return null;
  }

  if (data.length > 1) {
    console.warn('Multiple active seasons found. Using the most recent.');
    // sort or pick whichever one is appropriate
    return data[0]; // or do a sort on start_date
  }

  return data[0];
}
export async function handleSubmitResults({
  fixtureId,
  frameResults,
  homeTeamId,
  awayTeamId,
  divisionId,
  seasonId,
}) {
  // 1. Insert Frames
  const frameRows = frameResults.map((frame) => ({
    fixture: fixtureId,
    home_player: frame.homePlayer,
    away_player: frame.awayPlayer,
    winner: frame.winner,
  }));

  const { error: frameError } = await supabase.from('Frames').insert(frameRows);
  if (frameError) throw new Error('Failed to insert frame results: ' + frameError.message);

  // 2. Tally Wins
  const homeWins = frameResults.filter((f) => f.winner === homeTeamId).length;
  const awayWins = frameResults.filter((f) => f.winner === awayTeamId).length;
  const isDraw = homeWins === awayWins;

  // 3. Update Fixture
  const { error: fixtureError } = await supabase
    .from('Fixtures')
    .update({
      home_score: homeWins,
      away_score: awayWins,
      is_complete: true,
    })
    .eq('id', fixtureId);

  if (fixtureError) throw new Error('Failed to update fixture: ' + fixtureError.message);

  // 4. Fetch existing standing rows
  const { data: standings, error: standingsError } = await supabase
    .from('Standings')
    .select('*')
    .in('team', [homeTeamId, awayTeamId])
    .eq('division', divisionId)
    .eq('season', seasonId);

  if (standingsError || !standings) throw new Error('Failed to fetch standings');

  const homeStanding = standings.find((s) => s.team === homeTeamId);
  const awayStanding = standings.find((s) => s.team === awayTeamId);

  // 5. Prepare updates
  const updateHome = {
    played: homeStanding.played + 1,
    won: homeWins > awayWins ? homeStanding.won + 1 : homeStanding.won,
    lost: homeWins < awayWins ? homeStanding.lost + 1 : homeStanding.lost,
    points:
      homeWins > awayWins
        ? homeStanding.points + 2
        : isDraw
          ? homeStanding.points + 1
          : homeStanding.points,
  };

  const updateAway = {
    played: awayStanding.played + 1,
    won: awayWins > homeWins ? awayStanding.won + 1 : awayStanding.won,
    lost: awayWins < homeWins ? awayStanding.lost + 1 : awayStanding.lost,
    points:
      awayWins > homeWins
        ? awayStanding.points + 2
        : isDraw
          ? awayStanding.points + 1
          : awayStanding.points,
  };

  // 6. Apply updates
  const [homeUpdate, awayUpdate] = await Promise.all([
    supabase.from('Standings').update(updateHome).eq('id', homeStanding.id),
    supabase.from('Standings').update(updateAway).eq('id', awayStanding.id),
  ]);

  if (homeUpdate.error || awayUpdate.error) throw new Error('Failed to update standings');

  // 7. Recalculate Positions
  const { data: updatedStandings, error: fetchError } = await supabase
    .from('Standings')
    .select('id, team, points, won, played, Teams(display_name)')
    .eq('division', divisionId)
    .eq('season', seasonId);

  if (fetchError) throw new Error('Failed to fetch updated standings');

  const withTeamNames = updatedStandings.map((entry) => ({
    ...entry,
    Team: entry.Teams?.display_name ?? '',
  }));

  const sorted = recalculatePositions(withTeamNames);

  for (const row of sorted) {
    await supabase.from('Standings').update({ position: row.position }).eq('id', row.id);
  }
}
