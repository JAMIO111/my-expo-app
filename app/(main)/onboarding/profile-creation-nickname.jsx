import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useState } from 'react';
import CTAButton from '@components/CTAButton';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';

const ProfileCreation2 = () => {
  const [nickname, setNickname] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 2 of 4',
        }}
      />
      <View className="flex-1 gap-3 bg-bg-grouped-1">
        <StepPillGroup steps={4} currentStep={2} />
        <View className="bg-bg-grouped-1 p-4">
          <Text className="font-delagothic text-6xl font-bold text-text-1">
            What do you want to be known as?
          </Text>
          <Text className=" text-2xl text-text-2">
            This will be used to identify you in the app. It can be your first name, surname, or a
            nickname.
          </Text>
        </View>

        <View className="flex-1 rounded-t-3xl bg-bg-grouped-2 p-6">
          <View className="gap-1">
            <Text className="px-2 text-2xl font-bold text-text-1">Display Name</Text>
            <TextInput
              className="h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl text-text-1 placeholder:text-text-muted"
              placeholder="Enter Nickname..."
              autoCapitalize="words"
              value={nickname}
              onChangeText={setNickname}
            />
          </View>
          <View className="mt-5">
            <CTAButton
              type="info"
              text="Continue"
              callbackFn={() =>
                router.push({
                  pathname: '/(main)/onboarding/profile-creation-dob',
                  params: { ...params, nickname },
                })
              }
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default ProfileCreation2;

const styles = StyleSheet.create({});
