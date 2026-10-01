import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';

const OPTIONS = [
  { value: 'male', label: 'Male', icon: 'male', color: '#3B82F6' },
  { value: 'female', label: 'Female', icon: 'female', color: '#EC4899' },
];

const Gender = () => {
  useOnboardingStep(4, 5);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [gender, setGender] = useState(null);

  const next = () => {
    if (!gender) return;
    router.push({
      pathname: '/(main)/onboarding/(profile-onboarding)/avatar',
      params: { ...params, gender },
    });
  };

  return (
    <OnboardingScreen
      title="What's your gender?"
      subtitle="This decides which competitions you're eligible for."
      onCta={next}
      ctaDisabled={!gender}>
      <View className="gap-4">
        {OPTIONS.map((o, i) => {
          const active = gender === o.value;
          return (
            <Animated.View key={o.value} entering={FadeInDown.delay(i * 90).duration(380)}>
              <Pressable
                onPress={() => setGender(o.value)}
                className={`flex-row items-center gap-5 rounded-3xl border-2 p-5 ${
                  active ? 'border-white bg-white/20' : 'border-white/15 bg-white/10'
                }`}>
                <View
                  className="h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: o.color }}>
                  <Ionicons name={o.icon} size={34} color="white" />
                </View>
                <Text className="flex-1 font-saira-semibold text-2xl text-text-on-brand">
                  {o.label}
                </Text>
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full border-2 ${
                    active ? 'border-white bg-white' : 'border-white/40'
                  }`}>
                  {active ? <Ionicons name="checkmark" size={20} color="#111" /> : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
        <Text className="px-1 pt-2 font-saira text-sm text-text-on-brand-2">
          You can only change this a couple of times after signing up.
        </Text>
      </View>
    </OnboardingScreen>
  );
};

export default Gender;
