import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Text, Pressable } from 'react-native';
import supabase from '@lib/supabaseClient';
import { useRouter, useSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import IonIcons from 'react-native-vector-icons/Ionicons';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  //const { access_token, refresh_token } = useSearchParams();

  const access_token = 'accesstoken';
  const refresh_token = 'refreshtoken';

  useEffect(() => {
    if (access_token && refresh_token) {
      // Set session from tokens in URL query params
      supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    }
  }, [access_token, refresh_token]);

  const handleUpdatePassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated! Please log in.');
      router.push('/login'); // redirect to login or home screen
    }
  };

  if (!access_token) {
    return (
      <View style={{ padding: 20 }}>
        <Text>No valid reset token found.</Text>
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
}
