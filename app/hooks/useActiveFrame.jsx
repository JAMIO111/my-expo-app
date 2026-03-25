import { useMemo } from 'react';

export const useActiveFrame = (frames, setFrames, activeFrameId) => {
  const activeFrame = useMemo(
    () => frames.find((f) => f.tempId === activeFrameId),
    [frames, activeFrameId]
  );

  const updateActiveFrame = (key, value) => {
    if (!activeFrameId) return;

    setFrames((prev) =>
      prev.map((f) => {
        if (f.tempId !== activeFrameId) return f;

        const updated = { ...f };
        const previousValue = f[key];
        updated[key] = value;

        // 🔁 same logic you already had — but centralised

        // players changed
        if (
          key === 'homePlayer1' ||
          key === 'homePlayer2' ||
          key === 'awayPlayer1' ||
          key === 'awayPlayer2'
        ) {
          const home = [updated.homePlayer1, updated.homePlayer2].filter(Boolean);
          const away = [updated.awayPlayer1, updated.awayPlayer2].filter(Boolean);

          if (home.length === 0 || away.length === 0) {
            updated.winnerSide = null;
            updated.breakDish = null;
            updated.reverseDish = null;
            updated.lagWon = null;
          }
        }

        // winner changed
        if (key === 'winnerSide' && previousValue !== value) {
          updated.breakDish = null;
          updated.reverseDish = null;
        }

        // mutually exclusive
        if (key === 'breakDish' && previousValue !== value) {
          updated.reverseDish = null;
        }

        if (key === 'reverseDish' && previousValue !== value) {
          updated.breakDish = null;
        }

        // switching to singles
        if (key === 'allowDoubles' && value === false) {
          updated.homePlayer2 = null;
          updated.awayPlayer2 = null;
        }

        return updated;
      })
    );
  };

  return {
    activeFrame,
    updateActiveFrame,
  };
};
