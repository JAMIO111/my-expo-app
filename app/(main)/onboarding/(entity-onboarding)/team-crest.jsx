import { StyleSheet, Text, View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CrestEditor from '@components/CrestEditor';

const TeamCrest = () => {
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
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3 of 6',
        }}
      />
      <SafeViewWrapper
        useTopInset={false}
        useBottomInset={false}
        topColor="bg-brand"
        bottomColor="bg-brand-dark">
        <View className={`flex-1 justify-between gap-3 bg-brand`}>
          <StepPillGroup steps={6} currentStep={3} />
          <View className="flex-1 gap-3">
            <Text
              style={{ lineHeight: 40 }}
              className={`p-3 font-delagothic text-4xl font-bold text-text-on-brand`}>
              Create your team crest.
            </Text>
            <CrestEditor
              crest={teamDetails.crest || {}}
              buttonText="Save & Continue"
              handleSave={handleContinue}
            />
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamCrest;

const styles = StyleSheet.create({});
