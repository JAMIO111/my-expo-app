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
