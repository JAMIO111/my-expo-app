import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import ModalWrappedDatePicker from '@components/ModalWrappedDatePicker';
import CTAButton from '@components/CTAButton';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
const ProfileCreation3 = () => {
  const [dob, setDob] = useState(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log('dob', dob);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3 of 4',
        }}
      />
      <View className="flex-1 gap-3 bg-bg-grouped-1">
        <StepPillGroup steps={4} currentStep={3} />
        <View className="bg-bg-grouped-1 p-4">
          <Text className="mb-4 font-delagothic text-6xl font-bold text-text-1">{`When were you born ${params.firstName}?`}</Text>
          <Text className=" text-2xl text-text-2">So that we'll never forget your birthday.</Text>
        </View>
        <View className="w-full flex-1 rounded-t-3xl bg-bg-grouped-2 p-6">
          <View className="h-28 w-full gap-2">
            <Text className="px-2 text-2xl font-bold text-text-1">Date of Birth</Text>
            <ModalWrappedDatePicker maxDate={new Date()} value={dob} onChangeDate={setDob} />
          </View>
          <View className="mt-5">
            <CTAButton
              type="info"
              text="Continue"
              callbackFn={() =>
                router.push({
                  pathname: '/(main)/onboarding/profile-creation-avatar',
                  params: { ...params, dob },
                })
              }
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default ProfileCreation3;

const styles = StyleSheet.create({});
