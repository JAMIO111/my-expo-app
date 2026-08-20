import React, { createContext, useContext, useCallback, useState } from 'react';
import BadgeUnlockModal from '@components/BadgeUnlockModal';

const BadgeUnlockContext = createContext(null);

/**
 * Mount this once near the root of the app (e.g. app/_layout.tsx),
 * above everything else that might need to trigger it.
 */
export function BadgeUnlockProvider({ children }) {
  const [queue, setQueue] = useState([]);

  // Call this from anywhere via useBadgeUnlock() to show one or more badges.
  const showBadges = useCallback((badges) => {
    if (!badges || badges.length === 0) return;
    setQueue(Array.isArray(badges) ? badges : [badges]);
  }, []);

  const handleComplete = useCallback(() => {
    setQueue([]);
  }, []);

  return (
    <BadgeUnlockContext.Provider value={{ showBadges }}>
      {children}
      <BadgeUnlockModal visible={true} badges={queue} onComplete={handleComplete} />
    </BadgeUnlockContext.Provider>
  );
}

export function useBadgeUnlock() {
  const ctx = useContext(BadgeUnlockContext);
  if (!ctx) {
    throw new Error('useBadgeUnlock must be used within a BadgeUnlockProvider');
  }
  return ctx;
}
