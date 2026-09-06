import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';

export async function getOrCreateDeviceId() {
  const key = 'device_id';
  let deviceId = await SecureStore.getItemAsync(key);

  if (!deviceId) {
    deviceId = randomUUID();
    await SecureStore.setItemAsync(key, deviceId);
  }

  return deviceId;
}
