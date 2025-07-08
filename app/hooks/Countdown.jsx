import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import durationPlugin from 'dayjs/plugin/duration';

dayjs.extend(durationPlugin);

const useKickoffCountdown = (kickoffTimeString) => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const kickoffTime = new Date(kickoffTimeString);

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = kickoffTime - now;

      if (diffMs <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
        });
        return false; // signal to stop interval
      }

      const dur = dayjs.duration(diffMs);
      setCountdown({
        days: dur.days(),
        hours: dur.hours(),
        minutes: dur.minutes(),
        seconds: dur.seconds(),
        isPast: false,
      });

      return true;
    };

    // Run immediately
    const shouldContinue = updateCountdown();

    // Then every second
    let interval;
    if (shouldContinue) {
      interval = setInterval(updateCountdown, 1000);
    }

    return () => clearInterval(interval);
  }, [kickoffTimeString]);

  return countdown;
};

export default useKickoffCountdown;
