import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';

const Nickname = () => {
  useOnboardingStep(2, 5);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [nickname, setNickname] = useState('');

  // Quick picks built from the name they just gave us
  const suggestions = useMemo(() => {
    const first = String(params.firstName || '').trim();
    const last = String(params.surname || '').trim();
    const list = [first, last, first && last ? `${first} ${last.charAt(0)}` : '', `${first}${last ? ' ' + last : ''}`];
    return [...new Set(list.map((s) => s.trim()).filter(Boolean))].slice(0, 4);
  }, [params.firstName, params.surname]);

  const next = () => {
    const value = nickname.trim();
    if (!value) {
      Toast.show({ type: 'info', text1: 'Display Name Required', text2: 'Please enter a display name.' });
      return;
    }
    if (value.length > 30) {
      Toast.show({
        type: 'info',
        text1: 'Display Name Too Long',
        text2: 'Please keep it to 30 characters or fewer.',
      });
      return;
    }
    router.push({
      pathname: '/(main)/onboarding/(profile-onboarding)/dob',
      params: { ...params, nickname: value },
    });
  };

  return (
    <OnboardingScreen
      title="What should we call you?"
      subtitle="This is how you'll appear on fixtures, leaderboards and team lists."
      onCta={next}
      ctaDisabled={!nickname.trim()}>
      <View className="gap-6">
        <OnboardingInput
          label="Display name"
          icon="happy-outline"
          placeholder="e.g. Johnny"
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={30}
          returnKeyType="done"
          onSubmitEditing={next}
          hint="You can change this later in your profile."
        />

        {suggestions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(380)}>
            <Text className="mb-3 pl-1 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
              Quick picks
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {suggestions.map((s) => {
                const active = nickname.trim() === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setNickname(s)}
                    className={`rounded-full border-2 px-5 py-2 ${
                      active ? 'border-white bg-white' : 'border-white/20 bg-white/10'
                    }`}>
                    <Text
                      className={`font-saira-medium text-lg ${active ? 'text-black' : 'text-text-on-brand'}`}>
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
      </View>
    </OnboardingScreen>
  );
};

export default Nickname;
