import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useUser } from '@contexts/UserProvider';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import { View } from 'react-native';

const Name = () => {
  useOnboardingStep(1, 5);
  const router = useRouter();
  const { user } = useUser();

  // Social sign-ins already know the name; offer it as a starting point.
  const fullName = (user?.user_metadata?.full_name || '').trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [surname, setSurname] = useState(nameParts.slice(1).join(' '));
  const surnameRef = useRef(null);

  const next = () => {
    if (!firstName.trim() || !surname.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Name Required',
        text2: 'Please enter both your first name and surname.',
      });
      return;
    }
    router.push({
      pathname: '/(main)/onboarding/(profile-onboarding)/nickname',
      params: { firstName: firstName.trim(), surname: surname.trim() },
    });
  };

  return (
    <OnboardingScreen
      title="What's your name?"
      subtitle="So your team and opponents know who they're playing."
      onCta={next}
      ctaDisabled={!firstName.trim() || !surname.trim()}>
      <View className="gap-6">
        <OnboardingInput
          label="First name"
          icon="person-outline"
          placeholder="e.g. John"
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="given-name"
          textContentType="givenName"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => surnameRef.current?.focus()}
        />
        <OnboardingInput
          ref={surnameRef}
          delay={80}
          label="Surname"
          icon="person-outline"
          placeholder="e.g. Smith"
          value={surname}
          onChangeText={setSurname}
          autoComplete="family-name"
          textContentType="familyName"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={next}
        />
      </View>
    </OnboardingScreen>
  );
};

export default Name;
