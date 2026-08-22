import { useMemo } from 'react';

export const useActiveFrame = (frames, setFrames, activeFrameId) => {
  const activeFrame = useMemo(
    () => frames.find((f) => f.tempId === activeFrameId),
    [frames, activeFrameId]
  );

  const getTeammateId = (playerId, frame) => {
    if (!playerId) return null;
    if (frame.homePlayer1?.id === playerId) return frame.homePlayer2?.id ?? null;
    if (frame.homePlayer2?.id === playerId) return frame.homePlayer1?.id ?? null;
    if (frame.awayPlayer1?.id === playerId) return frame.awayPlayer2?.id ?? null;
    if (frame.awayPlayer2?.id === playerId) return frame.awayPlayer1?.id ?? null;
    return null;
  };

  const DISH_KEYS = ['breakDish1', 'breakDish2', 'reverseDish1', 'reverseDish2'];

  const updateActiveFrame = (key, value) => {
    if (!activeFrameId) return;

    setFrames((prev) =>
      prev.map((f) => {
        if (f.tempId !== activeFrameId) return f;

        const updated = { ...f };
        const previousValue = f[key];
        updated[key] = value;

        if (key === 'frameType') {
          if (updated.frameType !== previousValue) {
            updated.breakDish1 = null;
            updated.breakDish2 = null;
            updated.reverseDish1 = null;
            updated.reverseDish2 = null;
            updated.lagWon = null;
          }
        }

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
            updated.breakDish1 = null;
            updated.breakDish2 = null;
            updated.reverseDish1 = null;
            updated.reverseDish2 = null;
            updated.lagWon = null;
          }

          const currentIds = [...home, ...away].map((p) => p.id);
          if (updated.lagWon && !currentIds.includes(updated.lagWon)) {
            updated.lagWon = null;
          }
          if (updated.breakDish1 && !currentIds.includes(updated.breakDish1)) {
            updated.breakDish1 = null;
          }
          if (updated.breakDish2 && !currentIds.includes(updated.breakDish2)) {
            updated.breakDish2 = null;
          }
          if (updated.reverseDish1 && !currentIds.includes(updated.reverseDish1)) {
            updated.reverseDish1 = null;
          }
          if (updated.reverseDish2 && !currentIds.includes(updated.reverseDish2)) {
            updated.reverseDish2 = null;
          }
        }

        // ── Winner changed: only clear dish fields that are now INVALID,
        //    i.e. credited to a player who isn't on the new winning side
        //    (or, if there's no winner at all, everything is invalid) ───
        if (key === 'winnerSide' && previousValue !== value) {
          const home = [updated.homePlayer1, updated.homePlayer2].filter(Boolean).map((p) => p.id);
          const away = [updated.awayPlayer1, updated.awayPlayer2].filter(Boolean).map((p) => p.id);
          const winningIds = value === 'home' ? home : value === 'away' ? away : [];

          DISH_KEYS.forEach((k) => {
            if (updated[k] && !winningIds.includes(updated[k])) {
              updated[k] = null;
            }
          });
        }

        // ── Break dish ────────────────────────────────────────────────
        if ((key === 'breakDish1' || key === 'breakDish2') && previousValue !== value) {
          const isSlot1 = key === 'breakDish1';
          const ownReverseKey = isSlot1 ? 'reverseDish1' : 'reverseDish2';
          const teammateBreakKey = isSlot1 ? 'breakDish2' : 'breakDish1';
          const teammateReverseKey = isSlot1 ? 'reverseDish2' : 'reverseDish1';

          if (updated.frameType === 'scotch-doubles') {
            updated[ownReverseKey] = null;
            if (value) {
              const teammateId = getTeammateId(value, updated);
              updated[teammateBreakKey] = teammateId;
              updated[teammateReverseKey] = null;
            } else {
              updated[teammateBreakKey] = null;
            }
          } else if (value) {
            DISH_KEYS.forEach((k) => {
              if (k !== key) updated[k] = null;
            });
          }
        }

        // ── Reverse dish ──────────────────────────────────────────────
        if ((key === 'reverseDish1' || key === 'reverseDish2') && previousValue !== value) {
          const isSlot1 = key === 'reverseDish1';
          const ownBreakKey = isSlot1 ? 'breakDish1' : 'breakDish2';
          const teammateReverseKey = isSlot1 ? 'reverseDish2' : 'reverseDish1';
          const teammateBreakKey = isSlot1 ? 'breakDish2' : 'breakDish1';

          if (updated.frameType === 'scotch-doubles') {
            updated[ownBreakKey] = null;
            if (value) {
              const teammateId = getTeammateId(value, updated);
              updated[teammateReverseKey] = teammateId;
              updated[teammateBreakKey] = null;
            } else {
              updated[teammateReverseKey] = null;
            }
          } else if (value) {
            DISH_KEYS.forEach((k) => {
              if (k !== key) updated[k] = null;
            });
          }
        }

        // switching to singles
        if (key === 'frameType' && value === 'singles') {
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

export default useActiveFrame;
