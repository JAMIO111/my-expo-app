import { View, Text } from 'react-native';
import { useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useCompetitions } from '@hooks/useCompetitions';
import { ScrollView } from 'react-native-gesture-handler';
import { useCompetitionInstances } from '@hooks/useCompetitionInstances';
import Toast from 'react-native-toast-message';
import CompetitionBlueprint from '@components/CompetitionBlueprint';

// ─── Reusable chip (mirrors StatusBadge) ─────────────────────────────────────

const Chip = ({ icon, label, colors }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors?.background ?? 'rgba(0,0,0,0.05)',
      borderColor: colors?.border ?? 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    }}>
    {icon}
    <Text
      style={{
        fontFamily: 'Saira_500Medium',
        fontSize: 12,
        color: colors?.text ?? 'rgba(0,0,0,0.5)',
      }}>
      {label}
    </Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const index = () => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { currentRole } = useUser();
  const {
    data: competitions = [],
    isLoading,
    isError,
  } = useCompetitions({
    districtId: currentRole?.district?.id,
  });
  const { data: competitionsInstances } = useCompetitionInstances(currentRole?.activeSeason?.id);

  console.log(competitions, competitionsInstances);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title="Initiate Competition" />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
        <View className="mt-16 flex-1 bg-bg-1">
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              gap: 12,
              paddingTop: 10,
              paddingBottom: 60,
              paddingHorizontal: 10,
            }}
            className="flex-1 bg-bg-2">
            {competitions
              .sort((a, b) => {
                const aCount =
                  competitionsInstances?.filter((i) => i.competition_id === a.id).length ?? 0;
                const bCount =
                  competitionsInstances?.filter((i) => i.competition_id === b.id).length ?? 0;
                return aCount - bCount;
              })
              .map((competition) => {
                const numberOfInstances =
                  competitionsInstances?.filter((i) => i.competition_id === competition.id)
                    .length ?? 0;
                return (
                  <CompetitionBlueprint
                    key={competition.id}
                    competition={competition}
                    numberOfInstances={numberOfInstances}
                    onPress={() => {
                      if (hasNavigated.current) return;
                      hasNavigated.current = true;
                      setTimeout(() => {
                        hasNavigated.current = false;
                      }, 500);
                      if (numberOfInstances > 0) {
                        Toast.show({
                          type: 'info',
                          text1: 'Competition Already Initiated',
                          text2: `There ${numberOfInstances === 1 ? 'is' : 'are'} already ${numberOfInstances} instance${numberOfInstances === 1 ? '' : 's'} of this competition. You can manage existing instances from the main competitions screen.`,
                        });
                        return;
                      }
                      router.push(
                        `/competitions/initiate-competition/modify-competition-rules?competitionId=${competition.id}`
                      );
                    }}
                  />
                );
              })}
          </ScrollView>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default index;
