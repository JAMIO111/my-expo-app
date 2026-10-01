import { StyleSheet, Text, View, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';

const AdminOrPlayer = () => {
  useOnboardingStep(null, null, { showBack: false });
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerBackVisible: false, gestureEnabled: false }} />
      <OnboardingScreen
        title="How will you use Break Room?"
        subtitle="Pick the role that fits. You can be both later on.">
        <View className="gap-4">
          <ChoiceCard
            icon="people"
            iconColor="#10B981"
            title="I'm a player"
            subtitle="Join or create a team and play in a league"
            delay={0}
            onPress={() =>
              router.push({
                pathname: '/(main)/onboarding/(entity-onboarding)/create-join-team',
                params: { isNewTeam: false },
              })
            }
          />
          <ChoiceCard
            icon="shield-checkmark"
            iconColor="#8B5CF6"
            title="I'm a league admin"
            subtitle="Set up and run a league with an access code"
            delay={90}
            onPress={() =>
              router.push({
                pathname: '/(main)/onboarding/(entity-onboarding)/unique-code',
                params: { isNewLeague: true },
              })
            }
          />
        </View>
      </OnboardingScreen>
    </>
  );
};

export default AdminOrPlayer;
