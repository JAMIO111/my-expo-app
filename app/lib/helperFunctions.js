import supabase from '@/lib/supabaseClient';

export function generateQuadraticTiers(startValue, endValue, numTiers, curveStrength = 2) {
  const tiers = [];

  for (let i = 0; i < numTiers; i++) {
    const t = i / (numTiers - 1); // normalized progress [0, 1]
    const curved = Math.pow(t, curveStrength); // apply quadratic curve
    const value = Math.round(startValue + (endValue - startValue) * curved);
    tiers.push(value);
  }
  console.log('Generated tiers:', [...tiers]);
  return tiers;
}

export function calculateLevel(xp) {
  const level = Math.floor(Math.sqrt(xp / 100));
  const currentLevelXp = 100 * level * level;
  const nextLevel = level + 1;
  const nextLevelXp = 100 * nextLevel * nextLevel;

  return {
    level,
    currentXp: xp,
    currentLevelXp,
    nextLevelXp,
    progressToNextLevel: ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100,
    isMaxLevel: false, // You can add a cap if needed
  };
}

export const getContrastColor = (hex, minContrastWhite = 2.5) => {
  const normalizeHex = hex.replace('#', '');

  const r = parseInt(normalizeHex.substring(0, 2), 16) / 255;
  const g = parseInt(normalizeHex.substring(2, 4), 16) / 255;
  const b = parseInt(normalizeHex.substring(4, 6), 16) / 255;

  const linear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;

  // Prefer white if contrast is good enough
  if (contrastWithWhite >= minContrastWhite) return 'white';

  // Otherwise fallback to black
  return 'black';
};

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
  isWithinInterval,
  isSameDay,
  isBefore,
  nextDay,
  addWeeks,
  addMonths,
  setHours,
  setMinutes,
  differenceInCalendarWeeks,
  format,
} from 'date-fns';
import { shuffle } from 'lodash';

function getNthWeekdayOfMonth(year, month, weekdayIndex, nth) {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekdayIndex) {
      count++;
      if (count === nth) return date;
    }
  }
  return null;
}

export function generateFixtures({
  frequency,
  matchIntervalWeeks = 1,
  matchDays = [],
  monthlyMatchDays = [],
  reverseGapWeeks = 4,
  matchTimes = [],
  teams,
  startDate,
  seasonId,
  divisionId,
  excludedRanges = [],
}) {
  if (teams.length % 2 !== 0) teams.push('BYE');

  const dayToIndex = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

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

  const firstLeg = rounds;
  const secondLeg = shuffle(
    firstLeg.map((r) => r.map(({ home, away }) => ({ home: away, away: home })))
  );

  const fixtures = [];
  const firstMatchDates = new Map();
  const originalStartDate = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  let currentDate = new Date(originalStartDate);
  let earliestDate = null;

  const isInExcludedRange = (date) =>
    excludedRanges.some(({ startDate, endDate }) => {
      const s = typeof startDate === 'string' ? parseISO(startDate) : startDate;
      const e = typeof endDate === 'string' ? parseISO(endDate) : endDate;
      return isWithinInterval(date, { start: s, end: e });
    });

  const getMonthlyMatchDatesForMonth = (year, month) => {
    const dates = [];
    for (let i = 0; i < monthlyMatchDays.length; i++) {
      const { week, day } = monthlyMatchDays[i];
      const idx = dayToIndex[day.toLowerCase()];
      const nthDate = getNthWeekdayOfMonth(year, month, idx, week);
      if (
        nthDate &&
        !isInExcludedRange(nthDate) &&
        (isSameDay(nthDate, originalStartDate) || !isBefore(nthDate, originalStartDate))
      ) {
        dates.push({ date: nthDate, time: matchTimes[i], key: `${week}_${day}` });
      }
    }
    return dates.sort((a, b) => a.date - b.date);
  };

  const getWeeklyMatchDatesForWeek = (startOfWeek) => {
    const dates = [];
    for (let i = 0; i < matchDays.length; i++) {
      const day = matchDays[i];
      const idx = dayToIndex[day.toLowerCase()];
      const matchDate = nextDay(startOfWeek, idx);
      if (
        !isInExcludedRange(matchDate) &&
        (isSameDay(matchDate, originalStartDate) || !isBefore(matchDate, originalStartDate))
      ) {
        dates.push({ date: matchDate, time: matchTimes[i], key: day });
      }
    }
    return dates.sort((a, b) => a.date - b.date);
  };

  const scheduleRounds = (roundSet, isReverse = false) => {
    let roundIndex = 0;

    while (roundIndex < roundSet.length) {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      const validDates = frequency.startsWith('monthly')
        ? getMonthlyMatchDatesForMonth(year, month)
        : getWeeklyMatchDatesForWeek(currentDate);

      for (const { date: matchDate, time } of validDates) {
        const round = roundSet[roundIndex];
        const matchDateTime = setMinutes(setHours(matchDate, time.getHours()), time.getMinutes());

        const teamsScheduled = new Set();
        let valid = true;

        for (const { home, away } of round) {
          if (teamsScheduled.has(home) || teamsScheduled.has(away)) {
            valid = false;
            break;
          }

          if (isReverse) {
            const reverseKey = `${away}-${home}`;
            const firstDateStr = firstMatchDates.get(reverseKey);
            if (!firstDateStr) {
              valid = false;
              break;
            }
            const firstDate = parseISO(firstDateStr);
            const weekDiff = differenceInCalendarWeeks(matchDate, firstDate);
            if (weekDiff < reverseGapWeeks) {
              valid = false;
              break;
            }
          }

          teamsScheduled.add(home);
          teamsScheduled.add(away);
        }

        if (!valid) continue;

        for (const { home, away } of round) {
          fixtures.push({
            home_team: home,
            away_team: away,
            date_time: matchDateTime.toISOString(),
            season: seasonId,
            division: divisionId,
            home_score: 0,
            away_score: 0,
          });

          if (!isReverse) {
            firstMatchDates.set(`${home}-${away}`, format(matchDateTime, 'yyyy-MM-dd'));
          }

          // Track the earliest match date
          if (!earliestDate || matchDateTime < earliestDate) {
            earliestDate = matchDateTime;
          }
        }

        roundIndex++;
        if (roundIndex >= roundSet.length) break;
      }

      currentDate = frequency.startsWith('monthly')
        ? addMonths(currentDate, 1)
        : addWeeks(currentDate, matchIntervalWeeks);
    }
  };

  scheduleRounds(firstLeg, false);
  scheduleRounds(secondLeg, true);

  return {
    fixtures,
    earliestMatchDate: earliestDate?.toISOString() ?? null,
  };
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
  console.log(`✅ Created season with ID: ${seasonId}`);

  // 2. Get all divisions in this district (you may want to sort them by tier/level if available)
  const { data: divisions, error: divisionError } = await supabase
    .from('Divisions')
    .select(
      'id, name, tier, default_promotion_spots, default_relegation_spots, draws_allowed, special_match'
    )
    .eq('district', districtId)
    .order('tier', { ascending: true });

  console.log('Divisions fetched before return:', divisions);

  if (divisionError || !divisions?.length) {
    console.error('❌ Error fetching divisions:', divisionError);
    return;
  }

  console.log('Divisions fetched after return:', divisions);

  // 3. Insert SeasonDivisions records
  for (let i = 0; i < divisions.length; i++) {
    console.log('Inserting SeasonDivisions inside loop');
    const division = divisions[i];
    const isTop = division.tier === 1;
    const isBottom = division.tier === divisions.length;
    const promotionSpots = isTop ? 0 : division.default_promotion_spots;
    const relegationSpots = isBottom ? 0 : division.default_relegation_spots;

    const { data, error: seasonDivInsertError } = await supabase
      .from('SeasonDivisions')
      .insert({
        season: seasonId,
        division: division.id,
        division_name: division.name,
        division_tier: division.tier,
        promotion_spots: promotionSpots,
        relegation_spots: relegationSpots,
        is_top_division: isTop,
        is_bottom_division: isBottom,
        draws_allowed: division.draws_allowed,
        special_match: division.special_match,
      })
      .select();

    if (seasonDivInsertError) {
      console.error(`❌ Failed to create SeasonDivision for ${division.id}:`, seasonDivInsertError);
    } else {
      console.log(`✅ Created SeasonDivision for division ${division.id}:`, data);
    }
  }

  // 4. For each division, fetch teams and initialize Standings
  for (const division of divisions) {
    const { data: teams, error: teamError } = await supabase
      .from('Teams')
      .select('id')
      .eq('division', division.id);

    if (teamError) {
      console.error(`❌ Error fetching teams for division ${division.id}:`, teamError);
      continue;
    }

    const rowsToInsert = teams.map((team) => ({
      team: team.id,
      division: division.id,
      season: seasonId,
      played: 0,
      points: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      special_match: division.special_match ? 0 : null,

      position: null,
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
      .select('id, team, played, points, won, drawn, lost, Teams(display_name)')
      .eq('division', division.id)
      .eq('season', seasonId);

    if (standingsFetchError || !standings) {
      console.error(
        `❌ Error fetching standings for division ${division.id}:`,
        standingsFetchError
      );
      continue;
    }

    const standingsWithNames = standings.map((entry) => ({
      ...entry,
      Team: entry.Teams?.display_name ?? '',
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

  console.log(`✅ Season "${seasonName}" created with standings and SeasonDivisions initialized.`);
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

export const getBgClass = (index) => {
  switch (index) {
    case 0:
      return 'bg-gold';
    case 1:
      return 'bg-silver';
    case 2:
      return 'bg-bronze';
    default:
      return 'bg-brand-light';
  }
};

export const getTextClass = (index) => {
  switch (index) {
    case 0:
      return 'text-black';
    case 1:
      return 'text-black';
    case 2:
      return 'text-black';
    default:
      return 'text-white';
  }
};
