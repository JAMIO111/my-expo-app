import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useCompetitions } from '@hooks/useCompetitions';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatAgeRestrictions } from '@components/CompetitionInstanceCard';
import { useCompetitionInstances } from '@hooks/useCompetitionInstances';
import Toast from 'react-native-toast-message';

const index = () => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { currentRole } = useUser();
  const {
    data: competitions = [],
    isLoading,
    isError,
  } = useCompetitions(currentRole?.district?.id);

  const { data: competitionsInstances, isLoading: isCompetitionsInstancesLoading } =
    useCompetitionInstances(currentRole?.activeSeason?.id);

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
        <View className="mt-16 flex-1 bg-brand">
          <Text className="bg-brand p-2 px-6 pt-3 font-saira-medium text-xl text-text-on-brand">
            Select a competition from your blueprints that you'd like to initiate for the{' '}
            {currentRole?.activeSeason.name} season.
          </Text>
          <ScrollView
            contentContainerStyle={{
              display: 'flex',
              flexGrow: 1,
              gap: 20,
              paddingTop: 10,
              paddingBottom: 60,
            }}
            className="flex-1 bg-brand px-4">
            <View className="gap-3">
              {competitions
                .sort(
                  // sort by number of instances
                  (a, b) => {
                    const aInstances = competitionsInstances?.filter(
                      (instance) => instance.competition_id === a.id
                    )?.length;
                    const bInstances = competitionsInstances?.filter(
                      (instance) => instance.competition_id === b.id
                    )?.length;
                    return aInstances - bInstances;
                  }
                )
                ?.map((competition) => {
                  console.log('Competition:', competition);
                  const numberOfInstances = competitionsInstances?.filter(
                    (instance) => instance.competition_id === competition.id
                  )?.length;
                  return (
                    <Pressable
                      key={competition.id}
                      onPress={() => {
                        if (hasNavigated.current) return;
                        hasNavigated.current = true;
                        setTimeout(() => {
                          hasNavigated.current = false;
                        }, 500); // Reset navigation state after 500ms
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
                      className="relative flex-row items-center gap-4 rounded-2xl bg-bg-1 px-4 py-3">
                      <View className="flex-1">
                        <Text className="font-saira-semibold text-2xl text-text-1">
                          {competition.name}
                        </Text>
                        <Text className="font-saira-medium text-text-2">
                          {competition.competitor_type.slice(0, 1).toUpperCase() +
                            competition.competitor_type.slice(1)}{' '}
                          {competition.competition_type.slice(0, 1).toUpperCase() +
                            competition.competition_type.slice(1)}
                          {' Format'}
                        </Text>
                        <View className="mt-2 flex-row items-center">
                          <View className="flex-1 flex-row items-center justify-start gap-1">
                            <View className="flex-row items-center justify-center gap-1">
                              {competition.gender !== 'female' && (
                                <Ionicons name="male" size={20} color="#0085E5" />
                              )}
                              {competition.gender !== 'male' && (
                                <Ionicons name="female" size={20} color="#FF69B4" />
                              )}
                            </View>

                            <View className="flex-row items-center justify-center gap-1">
                              <MaterialCommunityIcons
                                name="cake-variant-outline"
                                size={20}
                                color="#777"
                              />
                              <Text className="mt-2 font-saira text-xl text-text-2">
                                {formatAgeRestrictions(
                                  competition?.min_age,
                                  competition?.max_age
                                ) || 'All Ages'}
                              </Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward-outline" size={24} color="#666" />
                        </View>
                      </View>

                      <View
                        className={`absolute right-2 top-2 h-8 items-center justify-center rounded-xl border ${numberOfInstances === 0 ? 'border-theme-red bg-theme-red/20' : 'border-theme-green bg-theme-green/20'} px-3`}>
                        <Text
                          className={`font-saira-semibold ${numberOfInstances === 0 ? 'text-theme-red' : 'text-theme-green'} text-sm`}>
                          {numberOfInstances > 0
                            ? `${numberOfInstances} Instance${numberOfInstances > 1 ? 's' : ''}`
                            : 'No Instances'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </ScrollView>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
