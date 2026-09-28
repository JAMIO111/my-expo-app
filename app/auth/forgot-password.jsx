// app/forgot-password.tsx
import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import CTAButton from '@components/CTAButton';
import * as Linking from 'expo-linking';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    // The app's registered scheme is "breakroom" (app.config.js), not
    // "Break-Room" -- a hardcoded string here meant the reset link in the
    // email could never actually open the app. Linking.createURL builds it
    // from the real scheme, same as the OAuth redirect elsewhere. The path
    // has to match the actual route -- this file lives at
    // app/auth/reset-password.jsx, so the route is /auth/reset-password,
    // not /reset-password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('auth/reset-password'),
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Email Sent', 'Check your inbox for the password reset link.');
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-12 p-6">
      <View className="w-full gap-2">
        <Text className="w-full text-left font-delagothic text-5xl font-bold text-text-1">
          Forgotten Password
        </Text>
        <Text className="w-full font-saira text-2xl text-text-2">
          Enter your email and we'll send you a link to reset your password.
        </Text>
      </View>
      <View className="w-full gap-5">
        <View className="w-full gap-1">
          <Text className="text-left font-saira-medium text-2xl text-text-1">Email</Text>
          <TextInput
            className="h-16 rounded-xl border border-border-color bg-bg-grouped-2 px-4 font-saira text-xl text-text-1 placeholder:text-text-3"
            placeholder="JohnDoe@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View className="w-full">
          <CTAButton text="Send Reset Link" callbackFn={handleReset} />
        </View>
      </View>
    </View>
  );
};

export default ForgotPassword;
