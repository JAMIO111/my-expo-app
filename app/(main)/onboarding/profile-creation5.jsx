import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState, useRef } from 'react';
import CTAButton from '@components/CTAButton';

const ProfileCreation5 = () => {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
        }}
      />
      <View className="flex-1 bg-background-dark">
        <View className="bg-background-dark p-5">
          <Text className="text-text-1 mb-4 font-delagothic text-6xl font-bold">
            Let's get you affiliated.
          </Text>
          <Text className="text-text-2 text-2xl">
            Would you like to create a new team or join an existing one?
          </Text>
        </View>

        <View className="flex-1 gap-5 rounded-t-3xl bg-background p-6">
          <CTAButton
            type="info"
            text="Create a new team"
            callbackFn={() => router.push('/(main)/onboarding/create-team')}
          />
          <View className="mt-5">
            <CTAButton
              type="info"
              text="Join existing team"
              callbackFn={() => router.push('/(main)/onboarding/profile-creation6')}
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default ProfileCreation5;

const styles = StyleSheet.create({});
