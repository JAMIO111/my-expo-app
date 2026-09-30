import { supabase } from '@/lib/supabase';

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
  const level = 1 + Math.floor(Math.sqrt(xp / 100));
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







export async function getActiveSeason(districtId) {
  const { data, error } = await supabase
    .from('Seasons')
    .select('*')
    .eq('district', districtId)
    .eq('status', 'active'); // or whatever your active flag is

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

export const getSubscriptionAction = (current, target) => {
  if (!current) return 'buy';

  if (current.sku === target.sku) return 'current';

  if (current.tier === target.tier) {
    return current.interval === 'monthly' ? 'upgrade_interval' : 'downgrade_interval';
  }

  return current.tier === 'core' ? 'upgrade_tier' : 'downgrade_tier';
};

export const normalizeSubscription = (p) => {
  // SKU example:
  // com.jdigital.breakroom.pro.annual
  const sku = p.id ?? p.productId;
  const parts = sku.split('.');
  const tier = parts.at(-2);
  const intervalFromSku = parts.at(-1);

  let interval = intervalFromSku;

  // Prefer Apple’s subscription metadata when available
  if (p.subscriptionPeriodUnitIOS) {
    interval = p.subscriptionPeriodUnitIOS === 'year' ? 'annual' : 'monthly';
  }

  return {
    sku,
    tier,
    interval,
    price: p.price,
    displayPrice: p.displayPrice,
    currency: p.currency,
    title: p.title ?? p.displayName,
    description: p.description,
    platform: p.platform,
    raw: p,
  };
};



/**
 * Shifts a hex color's lightness by `amount` percentage points.
 * Positive amount = lighter, negative = darker. Clamped to 0–100.
 */
export function shiftLightness(hex, amount) {
  const { h, s, l } = hexToHsl(hex);
  const newL = Math.min(100, Math.max(0, l + amount));
  return hslToHex(h, s, newL);
}

function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default {
  generateQuadraticTiers,
  calculateLevel,
  getContrastColor,
  isBirthdayToday,
  getSeasonLabel,
  getAgeInYearsAndDays,
  generateFixtures,
  getActiveSeason,
  getBgClass,
  getTextClass,
  getSubscriptionAction,
  normalizeSubscription,
};
