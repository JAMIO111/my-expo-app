import { StyleSheet, Text, View, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';

const CreateJoinTeam = () => {
  useOnboardingStep(null, null);
  const router = useRouter();

  return (
    <OnboardingScreen
      title="Let's get you affiliated"
      subtitle="Do you want to start a new team, or join one that already exists?">
      <View className="gap-4">
        <ChoiceCard
          icon="enter"
          iconColor="#3B82F6"
          title="Join an existing team"
          subtitle="You'll need the team's 6-digit code"
          delay={0}
          onPress={() =>
            router.push({
              pathname: '/(main)/onboarding/(entity-onboarding)/unique-code',
              params: { isNewTeam: false },
            })
          }
        />
        <ChoiceCard
          icon="add-circle"
          iconColor="#F59E0B"
          title="Create a new team"
          subtitle="You'll need your league's 6-digit code"
          delay={90}
          onPress={() =>
            router.push({
              pathname: '/(main)/onboarding/(entity-onboarding)/unique-code',
              params: { isNewTeam: true },
            })
          }
        />
      </View>
    </OnboardingScreen>
  );
};

export default CreateJoinTeam;
