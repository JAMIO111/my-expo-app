import { Text, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import { useUser } from '@contexts/UserProvider';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';

const Gender = () => {
  const { user } = useUser();
  const params = useLocalSearchParams();

  console.log('User in Gender component:', user); // Debugging line

  const [gender, setGender] = useState(null);

  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 4 of 5',
          headerBackTitle: 'Gender',
        }}
      />

      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={5} currentStep={4} />
        <View className="p-5">
          <Text className="mb-4 font-delagothic text-5xl font-bold text-text-on-brand">
            What's your gender?
          </Text>
          <Text className="font-saira text-2xl text-text-on-brand-2">
            This is so we know which competitions you will be eligible for.
          </Text>
        </View>
        <View className="flex-row gap-5 p-5">
          <Pressable
            onPress={() => (gender === 'male' ? setGender(null) : setGender('male'))}
            className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 ${
              gender === 'male' ? 'border-theme-blue' : 'border-transparent'
            }`}>
            <Ionicons name="male" size={24} color="#007AFF" />
            <Text className="font-saira-medium text-lg text-text-1">Male</Text>
            {gender === 'male' && (
              <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-blue">
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => (gender === 'female' ? setGender(null) : setGender('female'))}
            className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 ${
              gender === 'female' ? 'border-theme-pink' : 'border-transparent'
            }`}>
            <Ionicons name="female" size={24} color="#FF2D55" />
            <Text className="font-saira-medium text-lg text-text-1">Female</Text>
            {gender === 'female' && (
              <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-pink">
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            )}
          </Pressable>
        </View>

        <View className="mt-4 px-5">
          <CTAButton
            type="yellow"
            textColor="black"
            text="Continue"
            callbackFn={() => {
              if (!gender) {
                Toast.show({
                  type: 'info',
                  text1: 'Gender Required',
                  text2: 'Please select your gender.',
                });
                return;
              }
              router.push({
                pathname: '/(main)/onboarding/(profile-onboarding)/avatar',
                params: { ...params, gender },
              });
            }}
          />
        </View>
      </View>
    </>
  );
};

export default Gender;
