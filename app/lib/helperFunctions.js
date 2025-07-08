import supabase from '@/lib/supabaseClient';

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
}) {
  if (teams.length % 2 !== 0) teams.push('BYE');

  const matchDayIndexes = matchDays.map((day) =>
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day)
  );

  const totalRounds = teams.length - 1;
  const half = teams.length / 2;
  let rotated = [...teams];
  const rounds = [];

  // Generate round-robin
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

  const firstMatchDates = new Map(); // Track original match dates
  const fixtures = [];
  let currentDate = parseISO(startDate);

  // Parse time string (e.g., "20:00")
  const [hour, minute] = time.split(':').map(Number);

  while (allMatches.length > 0) {
    for (let dayIndex of matchDayIndexes) {
      let matchDate = currentDate;
      if (getDay(currentDate) !== dayIndex) {
        matchDate = nextDay(currentDate, dayIndex);
      }

      const teamsPlayingToday = new Set();
      let gamesToday = 0;
      const maxGames = teams.length / 2;

      for (let i = 0; i < allMatches.length && gamesToday < maxGames; ) {
        const match = allMatches[i];
        const { home, away } = match;

        const key = `${away}-${home}`; // reversed key

        // Check reverse fixture timing
        if (firstMatchDates.has(key)) {
          const originalDate = parseISO(firstMatchDates.get(key));
          const weekDiff = differenceInCalendarWeeks(matchDate, originalDate);
          if (weekDiff < reverseGapWeeks) {
            i++; // too soon, skip for now
            continue;
          }
        }

        if (teamsPlayingToday.has(home) || teamsPlayingToday.has(away)) {
          i++;
          continue;
        }

        // Apply time to date
        const matchDateTime = setMinutes(setHours(matchDate, hour), minute);

        // Schedule match
        fixtures.push({
          home,
          away,
          date: format(matchDateTime, 'yyyy-MM-dd'),
          time: format(matchDateTime, 'HH:mm'),
          datetime: matchDateTime.toISOString(), // Full ISO datetime
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
