import { useMemo, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';

const ageOn = (dob) => {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
};

const Dob = () => {
  useOnboardingStep(3, 5);
  const router = useRouter();
  const params = useLocalSearchParams();

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13); // must be at least 13
    return d;
  }, []);
  const startDate = useMemo(() => new Date(Math.min(new Date(1995, 0, 1).getTime(), maxDob.getTime())), [maxDob]);

  const [dob, setDob] = useState(null);
  const [showAndroid, setShowAndroid] = useState(false);

  const onChange = (event, date) => {
    if (Platform.OS === 'android') setShowAndroid(false);
    if (event?.type === 'dismissed' || !date) return;
    setDob(date);
  };

  const next = () => {
    if (!dob) return;
    router.push({
      pathname: '/(main)/onboarding/(profile-onboarding)/gender',
      params: { ...params, dob: dob.toISOString() },
    });
  };

  return (
    <OnboardingScreen
      title={`When were you born${params.firstName ? `, ${params.firstName}` : ''}?`}
      subtitle="We use this for age-restricted competitions. You must be 13 or over."
      onCta={next}
      ctaDisabled={!dob}>
      <Animated.View entering={FadeInDown.duration(380)} className="gap-5">
        <Pressable
          onPress={() => Platform.OS === 'android' && setShowAndroid(true)}
          className="items-center rounded-3xl border-2 border-white/15 bg-white/10 px-6 py-8">
          <Ionicons name="calendar-outline" size={30} color="#FFFFFFAA" />
          <Text
            className={`mt-3 text-center font-saira-semibold text-3xl ${dob ? 'text-text-on-brand' : 'text-text-on-brand-2'}`}>
            {dob
              ? dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : Platform.OS === 'ios'
                ? 'Scroll to choose'
                : 'Tap to choose'}
          </Text>
          {dob ? (
            <Text className="mt-2 font-saira text-lg text-text-on-brand-2">{ageOn(dob)} years old</Text>
          ) : null}
        </Pressable>

        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={dob ?? startDate}
            mode="date"
            display="spinner"
            themeVariant="dark"
            textColor="#FFFFFF"
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={maxDob}
            onChange={onChange}
            style={{ width: '100%' }}
          />
        ) : showAndroid ? (
          <DateTimePicker
            value={dob ?? startDate}
            mode="date"
            display="default"
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={maxDob}
            onChange={onChange}
          />
        ) : null}
      </Animated.View>
    </OnboardingScreen>
  );
};

export default Dob;
