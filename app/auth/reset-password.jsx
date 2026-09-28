import React, { useEffect, useState } from 'react';
import { View, TextInput, Alert, Text, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import CTAButton from '@components/CTAButton';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { getLastDeepLink, subscribeDeepLink } from '@lib/lastDeepLink';

// Supabase's recovery link delivers the tokens as a URL *fragment*
// (#access_token=...&refresh_token=...&type=recovery), not query params, so
// expo-router's useSearchParams/useLocalSearchParams (which only see what's
// after "?") can never see them -- this has to read the raw URL itself.
// Split on the first "=" only, since a token value can itself contain "=".
const parseFragmentParams = (url) => {
  const fragment = url?.split('#')[1];
  if (!fragment) return {};

  const params = {};
  for (const part of fragment.split('&')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    const value = decodeURIComponent(part.slice(eq + 1));
    params[key] = value;
  }
  return params;
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [tokenError, setTokenError] = useState(null); // null | string reason
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const applyTokensFromUrl = async (url) => {
      console.log('[ResetPassword] Checking URL for tokens:', url);
      if (!url) return 'No reset link URL was received.';

      const params = parseFragmentParams(url);

      // Supabase embeds its own reason here (e.g. otp_expired) when the link
      // itself was rejected server-side, instead of returning tokens.
      if (params.error) {
        return params.error_description || params.error || 'This reset link was rejected.';
      }

      if (!params.access_token || !params.refresh_token) {
        return 'No reset tokens were found in this link.';
      }

      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (error) {
        console.error('[ResetPassword] Failed to set session from reset link:', error);
        return error.message;
      }
      return null; // success
    };

    const tryUrl = async (url) => {
      const reason = await applyTokensFromUrl(url);
      if (!mounted) return;
      if (reason) {
        setTokenError(reason);
      } else {
        setSessionReady(true);
        setTokenError(null);
      }
    };

    tryUrl(getLastDeepLink());

    // Covers the same URL arriving again, or a second link tapped while
    // this screen is already open.
    const unsubscribe = subscribeDeepLink(tryUrl);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', "Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated! Please log in.');
      router.replace('/auth/login');
    }
  };

  if (tokenError) {
    return (
      <View style={{ padding: 20, gap: 8 }}>
        <Text className="text-text-1">
          This password reset link is invalid or has expired. Please request a new one.
        </Text>
        <Text className="text-text-2">({tokenError})</Text>
      </View>
    );
  }

  if (!sessionReady) {
    return (
      <View style={{ padding: 20 }}>
        <Text className="text-text-1">Verifying your reset link…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-5 p-6">
      <Text className="w-full text-left font-delagothic text-3xl font-bold text-text-1">
        Update your password
      </Text>
      <View className="w-full gap-1">
        <Text className="text-left font-saira-medium text-2xl text-text-1">New Password</Text>
        <View className="relative w-full flex-row items-center">
          <TextInput
            className="h-16 w-full rounded-xl border border-border-color bg-bg-grouped-2 px-4 pr-12 font-saira text-xl text-text-1 placeholder:text-text-3"
            placeholder="* * * * * * * * * *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable
            className="absolute right-4"
            onPressIn={() => setShowPassword(!showPassword)}
            onPressOut={() => setShowPassword(!showPassword)}>
            <IonIcons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#888" />
          </Pressable>
        </View>
      </View>
      <View className="w-full rounded-xl bg-bg-grouped-2 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-text-1">Your password must include</Text>
          <Text className="text-theme-red">Too Weak</Text>
        </View>
        <View className="mt-5 gap-2">
          <Text className="text-text-2">At least 8 characters</Text>
          <Text className="text-text-2">At least 1 uppercase letter</Text>
          <Text className="text-text-2">At least 1 lowercase letter</Text>
          <Text className="text-text-2">At least 1 number</Text>
          <Text className="text-text-2">At least 1 special character</Text>
        </View>
      </View>
      <View className="w-full gap-1">
        <Text className="text-left font-saira-medium text-2xl text-text-1">Confirm Password</Text>
        <View className="relative w-full flex-row items-center">
          <TextInput
            className="h-16 w-full rounded-xl border border-border-color bg-bg-grouped-2 px-4 pr-12 font-saira text-xl text-text-1 placeholder:text-text-3"
            placeholder="* * * * * * * * * *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <Pressable
            className="absolute right-4"
            onPressIn={() => setShowConfirmPassword(!showConfirmPassword)}
            onPressOut={() => setShowConfirmPassword(!showConfirmPassword)}>
            <IonIcons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="#888" />
          </Pressable>
        </View>
      </View>
      <View className="w-full">
        <CTAButton
          text={loading ? 'Updating...' : 'Update Password'}
          disabled={loading}
          callbackFn={handleUpdatePassword}
        />
      </View>
    </View>
  );
};

export default ResetPassword;
