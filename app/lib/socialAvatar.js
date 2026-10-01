import * as FileSystem from 'expo-file-system/legacy';

// The profile photo a social sign-in (Google / Facebook) provides, if any. Apple doesn't share one.
export function getSocialAvatar(user) {
  if (!user) return null;

  const identities = user.identities || [];
  for (const provider of ['google', 'facebook']) {
    const identity = identities.find((i) => i.provider === provider);
    const data = identity?.identity_data || {};
    const url =
      data.avatar_url ||
      (typeof data.picture === 'string' ? data.picture : data.picture?.data?.url) ||
      null;
    if (url) return { url, provider, label: provider === 'google' ? 'Google' : 'Facebook' };
  }

  // Older sessions without identities
  const provider = user.app_metadata?.provider;
  const meta = user.user_metadata || {};
  const url = meta.avatar_url || (typeof meta.picture === 'string' ? meta.picture : null);
  if (url && (provider === 'google' || provider === 'facebook')) {
    return { url, provider, label: provider === 'google' ? 'Google' : 'Facebook' };
  }
  return null;
}

// Copy the provider's photo onto the device so it can be uploaded like any picked photo. Provider links
// can expire or change, so the app stores its own copy.
export async function downloadSocialAvatar(url) {
  const target = `${FileSystem.cacheDirectory}social-avatar-${Date.now()}.jpg`;
  const result = await FileSystem.downloadAsync(url, target);
  if (result.status !== 200) throw new Error('Could not download your photo');
  return result.uri;
}
