import Toast from 'react-native-toast-message';

// The fixture RPCs report failures with a stable code (Postgres error DETAIL, or
// `code` / `error` in the JSON they return). Captains and vice captains can act
// on the same fixture at the same time, so most of these mean "somebody else got
// there first": they show an info toast, refresh the fixture and (optionally)
// leave the now out-of-date screen.
const MESSAGES = {
  not_authorised: ['Not allowed', "You don't have permission to do that for this fixture.", 'error'],
  forbidden: ['Not allowed', "You don't have permission to do that for this fixture.", 'error'],
  fixture_not_found: ['Fixture not found', 'This fixture no longer exists.', 'error'],
  venue_not_found: ['Venue not found', 'The selected venue no longer exists.', 'error'],
  invalid_side: ['Invalid side', 'Please choose which side is forfeiting.', 'error'],
  best_of_not_set: [
    "Can't forfeit yet",
    'This competition has no frame count set, so a forfeit score cannot be worked out. Please contact your league admin.',
    'error',
  ],
  no_frames_selected: ['No frames selected', 'Select at least one frame to dispute.', 'info'],

  already_submitted: [
    'Already submitted',
    'These results have already been submitted by your captain or vice captain.',
    'info',
  ],
  not_submitted: ['Not submitted yet', 'Results have not been submitted for this fixture yet.', 'info'],
  already_disputed: [
    'Already disputed',
    'These results have already been disputed by your captain or vice captain.',
    'info',
  ],
  not_disputed: ['Not in dispute', 'This result is no longer in dispute.', 'info'],
  already_amended: [
    'Already amended',
    'These results have already been amended by your captain or vice captain.',
    'info',
  ],
  already_escalated: [
    'Already escalated',
    'This result has already been escalated to the league admin.',
    'info',
  ],
  already_approved: ['Already approved', 'These results have already been approved.', 'info'],
  fixture_forfeited: ['Fixture forfeited', 'This fixture has already been forfeited.', 'info'],
  awaiting_amendment: [
    'Awaiting amendment',
    'This result is in dispute. The home side needs to amend it before it can be approved.',
    'info',
  ],
  awaiting_opponent: [
    'Awaiting the other side',
    'The other side has to approve this forfeit.',
    'info',
  ],
  disputed_locked: [
    'Fixture locked',
    'This fixture is disputed and needs a league admin before it can be changed.',
    'info',
  ],
  fixture_changed: [
    'Results changed',
    'Someone else has updated these results. Reopen the fixture to see the latest version.',
    'info',
  ],
  frame_mismatch: [
    'Results changed',
    'A frame was changed or removed by someone else. Reopen the fixture to see the latest version.',
    'info',
  ],
  no_frames: ['No frames', 'Add at least one frame before submitting the result.', 'info'],
  missing_winner: ['Winner missing', 'Every frame needs a winner before the result can be submitted.', 'info'],
  too_early: [
    'Fixture has not started',
    'Results can only be submitted once the fixture has started.',
    'info',
  ],
  too_many_frames: ['Too many frames', 'This fixture has more frames than its best-of allows.', 'info'],
  too_many_bonus_frames: ['Too many bonus frames', 'Only one bonus frame is allowed per fixture.', 'info'],
  bonus_not_allowed: [
    'No bonus frame',
    'This competition does not have a bonus frame.',
    'info',
  ],
  invalid_player: [
    'Player not allowed',
    'A frame includes a player who is not part of this fixture, or a lag / dish was credited to someone who was not in the frame.',
    'error',
  ],
  duplicate_player: ['Duplicate player', 'A player cannot appear twice in the same frame.', 'error'],
  not_escalated: ['Not escalated', 'This fixture has not been escalated to the league admin.', 'info'],
  invalid_days: ['Invalid number of days', 'Choose between 1 and 30 days.', 'error'],
  network: ['Connection problem', 'Please check your internet connection and try again.', 'error'],
};

// Codes that mean the fixture moved on while the user was looking at an old copy.
const STALE_CODES = new Set([
  'already_submitted',
  'not_submitted',
  'already_disputed',
  'not_disputed',
  'already_amended',
  'already_escalated',
  'already_approved',
  'fixture_forfeited',
  'awaiting_amendment',
  'awaiting_opponent',
  'disputed_locked',
  'fixture_changed',
  'frame_mismatch',
]);

const ALIASES = {
  already_forfeited: 'fixture_forfeited',
  fixture_not_forfeitable: 'fixture_forfeited',
};

// Accepts a supabase-js error, an RPC JSON result ({ success: false, code } / { error })
// or an Error. Postgres errors carry our code in `details` (the SQLSTATE stays in
// `code`); JSON results carry it in `code` / `error`.
const CODE_SHAPE = /^[a-z][a-z_]*$/;

export function getFixtureErrorCode(source) {
  if (!source) return null;
  if (typeof source === 'string') {
    const code = source.toLowerCase();
    return ALIASES[code] || code;
  }

  let raw;
  if (source.success === false) {
    raw = source.code || source.error;
  } else {
    const detail = typeof source.details === 'string' ? source.details : source.detail;
    raw = typeof detail === 'string' && CODE_SHAPE.test(detail) ? detail : source.code;
  }
  if (typeof raw === 'string' && raw) {
    const code = raw.toLowerCase();
    if (code === '42501') return 'not_authorised';
    return ALIASES[code] || code;
  }
  const msg = String(source.message || '');
  if (/network request failed|failed to fetch|network error|timeout/i.test(msg)) return 'network';
  return null;
}

export function isStaleFixtureError(source) {
  return STALE_CODES.has(getFixtureErrorCode(source));
}

export async function refreshFixtureQueries(queryClient, fixtureId) {
  if (!queryClient) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['fixture-details', fixtureId] }),
    queryClient.invalidateQueries({ queryKey: ['ResultsByFixture', fixtureId] }),
    queryClient.invalidateQueries({ queryKey: ['FixturesAwaitingResults'] }),
    queryClient.invalidateQueries({ queryKey: ['fixtures-grouped'] }),
  ]);
}

// Shows the right toast for a failed fixture action. Returns { code, stale }.
//   fallbackTitle / fallbackMessage  used when the error has no known code
//   queryClient + fixtureId          refresh the fixture when it has moved on
//   onStale                          e.g. () => router.back()
export async function handleFixtureError(
  source,
  { fallbackTitle = 'Something went wrong', fallbackMessage, queryClient, fixtureId, onStale } = {}
) {
  const code = getFixtureErrorCode(source);
  const known = MESSAGES[code];
  const stale = STALE_CODES.has(code);

  if (known) {
    Toast.show({ type: known[2], text1: known[0], text2: known[1] });
  } else {
    Toast.show({
      type: 'error',
      text1: fallbackTitle,
      text2: fallbackMessage || 'Please try again.',
    });
  }

  if (stale) {
    await refreshFixtureQueries(queryClient, fixtureId);
    onStale?.(code);
  }
  return { code, stale };
}
