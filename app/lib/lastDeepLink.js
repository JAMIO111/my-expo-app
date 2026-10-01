import * as Linking from 'expo-linking';

/**
 * A tiny module-level store for the most recently seen deep-link URL.
 *
 * Why this exists: a screen reached VIA a deep link (like reset-password)
 * only mounts *after* expo-router's own navigation system has already
 * consumed that same incoming 'url' event to route here. A Linking
 * listener registered inside that screen's own useEffect is therefore
 * always too late to see the event that got it there -- it only works by
 * accident on a cold start, where Linking.getInitialURL() happens to still
 * return the launch URL. On a warm resume (app already running, link
 * tapped again), the screen's own listener never fires at all.
 *
 * This module captures both the cold-start URL and any later 'url' events
 * itself, as a side effect of being imported -- which happens as soon as
 * app/_layout.jsx (the root layout) loads, before any navigation or screen
 * mounting takes place. Screens read the latest value from here instead of
 * racing to catch the event themselves.
 */
let lastUrl = null;
const listeners = new Set();

const notify = (url) => {
  if (!url) return;
  lastUrl = url;
  listeners.forEach((fn) => fn(url));
};

Linking.getInitialURL()
  .then(notify)
  .catch((err) => console.error('[lastDeepLink] getInitialURL failed:', err));

Linking.addEventListener('url', ({ url }) => notify(url));

export const getLastDeepLink = () => lastUrl;

export const subscribeDeepLink = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
