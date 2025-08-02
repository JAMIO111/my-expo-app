import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseKey = Constants.expoConfig?.extra?.SUPABASE_KEY;

export const createSupabaseClient = async () => {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  // Load session from AsyncStorage
  const raw = await AsyncStorage.getItem('supabase.auth.token');
  const sessionObj = raw ? JSON.parse(raw) : null;

  if (sessionObj?.currentSession) {
    await client.auth.setSession(sessionObj.currentSession);
  }

  return client;
};
