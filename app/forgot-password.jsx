// app/forgot-password.tsx
import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import supabase from '@lib/supabaseClient';
import CTAButton from '@components/CTAButton';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'Break-Room://reset-password',
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
}
