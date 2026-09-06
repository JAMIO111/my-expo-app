import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getOrCreateDeviceId } from '@/lib/deviceId';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d4922a',
    });
  }

  return token;
}

export async function syncPushToken(playerId) {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;

  const deviceId = await getOrCreateDeviceId();

  await supabase.from('PushTokens').upsert(
    {
      player_id: playerId,
      token,
      device_id: deviceId,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  );
}

export async function clearPushTokenOnLogout(playerId) {
  const deviceId = await getOrCreateDeviceId();
  await supabase.from('PushTokens').delete().eq('player_id', playerId).eq('device_id', deviceId);
}
