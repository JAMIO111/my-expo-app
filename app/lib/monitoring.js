import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Crash and error reporting (Sentry).
//  * Off unless a DSN is configured (SENTRY_DSN) and not in local development.
//  * No personal details are sent: only the player id and role.
//  * Expected "business rule" failures (not allowed, division full, ...) are not errors and are ignored.

const dsn = Constants.expoConfig?.extra?.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN;
const enabled = !!dsn && !__DEV__;

// Postgres / PostgREST codes that mean "the request was refused for a normal reason".
const EXPECTED_DB_CODES = new Set([
  'P0001', // raise exception from our functions (validation / rules)
  'P0002', // not found
  '42501', // not authorised
  '23505', // unique violation (already handled by the caller)
  '23503', // foreign key
  'PGRST116', // no rows for single()
]);

const isNetworkError = (err) => {
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  );
};

export function isExpectedError(err) {
  if (!err) return true;
  if (EXPECTED_DB_CODES.has(err.code)) return true;
  if (isNetworkError(err)) return true;
  return false;
}

export function initMonitoring() {
  if (!enabled) return;
  Sentry.init({
    dsn,
    environment: Constants.expoConfig?.extra?.APP_ENV || 'production',
    release: Constants.expoConfig?.version,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    enableNativeFramesTracking: false,
    beforeSend(event) {
      // never send contact details
      if (event.user) event.user = { id: event.user.id, segment: event.user.segment };
      return event;
    },
  });
}

export function setMonitoringUser(playerId, role) {
  if (!enabled) return;
  if (!playerId) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: playerId, segment: role || 'player' });
}

// Report something that should not have happened. `context` says where (e.g. 'rpc:join_competition').
export function captureError(err, context) {
  if (!enabled || isExpectedError(err)) return;
  Sentry.withScope((scope) => {
    if (context) scope.setTag('source', String(context));
    Sentry.captureException(err instanceof Error ? err : new Error(err?.message || String(err)));
  });
}

export const wrapRoot = (component) => (enabled ? Sentry.wrap(component) : component);
