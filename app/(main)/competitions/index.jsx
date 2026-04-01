import { StyleSheet, View, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useCompetitionInstances } from '@hooks/useCompetitionInstances';
import CompetitionInstanceCard from '@components/CompetitionInstanceCard';

const index = () => {
  const { loading, currentRole } = useUser();
  const { data: competitionsInstances, isLoading: isCompetitionsLoading } = useCompetitionInstances(
    currentRole?.activeSeason.id
  );
  console.log('Competitions:', competitionsInstances);

  const activeCompetitions = competitionsInstances?.filter(
    (instance) => instance.status === 'active'
  );
  const completedCompetitions = competitionsInstances?.filter(
    (instance) => instance.status === 'completed'
  );
  const upcomingCompetitions = competitionsInstances?.filter(
    (instance) => instance.status === 'upcoming'
  );
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                showBack={false}
                title={`${currentRole?.district?.name} Competitions`}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 20, paddingVertical: 20 }}
          className="mt-16 flex-1 bg-brand px-4">
          <View>
            <Text className="mb-2 px-1 font-saira-medium text-2xl text-text-on-brand">
              Active Competitions
            </Text>
            <View className="gap-4">
              {activeCompetitions?.map((instance) => (
                <CompetitionInstanceCard key={instance.id} instance={instance} />
              ))}
            </View>
          </View>
          <View>
            <Text className="mb-2 px-1 font-saira-medium text-2xl text-text-on-brand">
              Upcoming Competitions
            </Text>
            <View className="gap-4">
              {upcomingCompetitions?.map((instance) => (
                <CompetitionInstanceCard key={instance.id} instance={instance} />
              ))}
            </View>
          </View>
          <View>
            <Text className="mb-2 px-1 font-saira-medium text-2xl text-text-on-brand">
              Completed Competitions
            </Text>
            <View className="gap-4">
              {completedCompetitions?.map((instance) => (
                <CompetitionInstanceCard key={instance.id} instance={instance} />
              ))}
            </View>
          </View>
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
