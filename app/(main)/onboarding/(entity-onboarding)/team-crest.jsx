import { StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import CrestEditor from '@components/CrestEditor';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';

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
    <>
<View className="flex-1 justify-between gap-3 bg-brand">
        <Text
          style={{ lineHeight: 40 }}
          className={`p-3 font-delagothic text-4xl font-bold text-text-on-brand`}>
          Create your team crest.
        </Text>
        <ScrollView className={`flex-1 bg-brand p-4`}>
          <View className="rounded-3xl shadow-md">
            <View className="flex-1 gap-3 overflow-hidden rounded-3xl bg-bg-2">
              <CrestEditor
                crest={teamDetails.crest || {}}
                buttonText="Save & Continue"
                handleSave={handleContinue}
                isSaving={false}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default TeamCrest;

const styles = StyleSheet.create({});
