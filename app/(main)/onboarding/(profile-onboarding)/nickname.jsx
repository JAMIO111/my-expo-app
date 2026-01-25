import { StyleSheet, Text, View, Alert } from 'react-native';
import { useState } from 'react';
import CTAButton from '@components/CTAButton';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';

const Nickname = () => {
  const [nickname, setNickname] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 2 of 4',
          headerBackTitle: 'Name',
        }}
      />
      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={4} currentStep={2} />
        <View className="p-4">
          <Text className="font-delagothic text-5xl font-bold text-text-on-brand">
            What do you want to be known as?
          </Text>
          <Text className=" font-saira text-2xl text-text-on-brand-2">
            This will be used to identify you in the app. It can be your first name, surname, or a
            nickname.
          </Text>
        </View>

        <View className="flex-1 rounded-t-3xl bg-brand-dark p-6">
          <View className="gap-1">
            <CustomTextInput
              placeholder="e.g. Johnny"
              title="Display Name"
              titleColor="text-text-on-brand"
              leftIconName="person"
              iconColor="green"
              value={nickname}
              onChangeText={setNickname}
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>
          <View className="mt-8">
            <CTAButton
              type="yellow"
              textColor="black"
              text="Continue"
              callbackFn={() => {
                if (nickname.trim() === '') {
                  Alert.alert('Error', 'Please enter a display name.');
                  return;
                }
                router.push({
                  pathname: '/(main)/onboarding/(profile-onboarding)/dob',
                  params: { ...params, nickname },
                });
              }}
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default Nickname;

const styles = StyleSheet.create({});
