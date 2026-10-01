import { StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import CrestEditor from '@components/CrestEditor';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeamCrest = () => {
  useOnboardingStep(3, 6);
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const teams = JSON.parse(params.teams || '[]');
  const teamDetails = JSON.parse(params.teamDetails || '{}');

  const isSameCrest = (a, b) => {
    if (!a || !b) return false;

    return (
      a.type === b.type &&
      a.color1 === b.color1 &&
      a.color2 === b.color2 &&
      a.thickness === b.thickness
    );
  };

  const handleContinue = (crestData) => {
    try {
      const duplicate = teams.some((team) => isSameCrest(team.crest, crestData));

      if (duplicate) {
        Alert.alert(
          'Crest already in use',
          'Another team in this league already uses this crest. Pick different colours or a different style.'
        );
        return;
      }

      const updatedTeamDetails = {
        ...teamDetails,
        crest: crestData,
      };

      router.push({
        pathname: '/(main)/onboarding/(entity-onboarding)/team-address',
        params: {
          league: JSON.stringify(league),
          teamDetails: JSON.stringify(updatedTeamDetails),
          teams: JSON.stringify(teams),
        },
      });
    } catch (error) {
      Alert.alert('Error', `An error occurred: ${error.message}`);
    }
  };

  return (
    <OnboardingScreen
      title="Design your crest"
      subtitle="Pick a shape and colours. Each team in a league needs its own look.">
      <Animated.View entering={FadeInDown.duration(380)} className="overflow-hidden rounded-3xl bg-bg-2">
        <CrestEditor
          crest={teamDetails.crest || {}}
          buttonText="Save & continue"
          handleSave={handleContinue}
          isSaving={false}
        />
      </Animated.View>
    </OnboardingScreen>
  );
};

export default TeamCrest;
