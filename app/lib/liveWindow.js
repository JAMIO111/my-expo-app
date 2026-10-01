import { endOfDay } from 'date-fns';

// A fixture is "live" from kick-off until midnight (device local time) at the end of its date. After
// that the live pill is hidden, whether or not the result has been entered.
export const isInLiveWindow = (dateTime, now = new Date()) => {
  if (!dateTime) return false;
  const kickoff = new Date(dateTime);
  return now >= kickoff && now <= endOfDay(kickoff);
};
