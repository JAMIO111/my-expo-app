import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import durationPlugin from 'dayjs/plugin/duration';

dayjs.extend(durationPlugin);

const OVERDUE_HOURS = 24;

const useKickoffCountdown = (kickoffTimeString) => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    isOverdue: false,
  });

  useEffect(() => {
    const kickoffTime = dayjs(kickoffTimeString);

    const updateCountdown = () => {
      const now = dayjs();
      const diffMs = kickoffTime.diff(now);

      // kickoff already happened
      if (diffMs <= 0) {
        const isOverdue = now.isAfter(kickoffTime.add(OVERDUE_HOURS, 'hour'));

        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
          isOverdue,
        });

        // stop ticking once kickoff has passed
        return false;
      }

      const dur = dayjs.duration(diffMs);

      setCountdown({
        days: dur.days(),
        hours: dur.hours(),
        minutes: dur.minutes(),
        seconds: dur.seconds(),
        isPast: false,
        isOverdue: false,
      });

      return true;
    };

    // run immediately
    const shouldContinue = updateCountdown();

    let interval;
    if (shouldContinue) {
      interval = setInterval(updateCountdown, 1000);
    }

    return () => clearInterval(interval);
  }, [kickoffTimeString]);

  return countdown;
};

export default useKickoffCountdown;
