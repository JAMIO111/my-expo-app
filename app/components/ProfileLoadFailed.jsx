import { useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

// Shown when someone is signed in but their profile could not be loaded, instead of a blank screen.
export default function ProfileLoadFailed({ onRetry, deleted = false }) {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-brand p-8">
      <Image
        source={require('@assets/BR-Logo-1024-No-Background.png')}
        className="h-28 w-28"
        resizeMode="contain"
      />
      <Text className="text-center font-delagothic text-3xl text-text-on-brand">
        {deleted ? 'This account has been deleted' : "We couldn't load your profile"}
      </Text>
      <Text className="text-center font-saira text-lg text-text-on-brand-2">
        {deleted
          ? 'Sign out to use a different account.'
          : 'Check your connection and try again. If it keeps happening, sign out and back in.'}
      </Text>
      {!deleted && (
        <Pressable
          onPress={retry}
          disabled={retrying}
          className="w-full flex-row items-center justify-center rounded-xl bg-white px-8 py-3">
          {retrying ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="font-saira-semibold text-lg text-black">Try again</Text>
          )}
        </Pressable>
      )}
      <Pressable onPress={() => supabase.auth.signOut()} className="px-8 py-3">
        <Text className="font-saira-medium text-lg text-text-on-brand underline">Sign out</Text>
      </Pressable>
    </View>
  );
}
