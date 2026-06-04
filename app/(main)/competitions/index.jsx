import { useRef } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useCompetitionInstances } from '@hooks/useCompetitionInstances';
import CompetitionInstanceCard from '@components/CompetitionInstanceCard';
import { Ionicons } from '@expo/vector-icons';
import Heading from '@components/Heading';

const index = () => {
  const router = useRouter();
  const hasNavigated = useRef(false);
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
    (instance) => instance.status === 'upcoming' || instance.status === 'closed'
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
          contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 30, paddingVertical: 20 }}
          className="mt-16 flex-1 bg-bg-1 px-4">
          {currentRole?.type !== 'admin' && (
            <Pressable
              onPress={() => {
                if (hasNavigated.current) return;
                hasNavigated.current = true;
                setTimeout(() => {
                  hasNavigated.current = false;
                }, 500);
                router.push('/competitions/team-management');
              }}>
              <View className="flex-1 flex-row gap-8 rounded-2xl bg-brand p-4 shadow-sm">
                <View className="flex-1">
                  <Text className="font-saira-medium text-xl text-text-on-brand">
                    Competition Team Management
                  </Text>
                  <Text className="mt-2 font-saira text-sm text-text-on-brand-2">
                    Manage your existing teams and form new competition teams by inviting players to
                    join your doubles or trebles lineup.
                  </Text>
                </View>
                <Ionicons name="people" size={40} color="#FFFFFF66" />
                <View className="absolute bottom-6 right-4">
                  <Ionicons name="chevron-forward" size={26} color="#FFFFFFBB" />
                </View>
              </View>
            </Pressable>
          )}
          {isCompetitionsLoading ? (
            <View className="flex-1 items-center justify-center rounded-2xl bg-bg-2 py-12 shadow-sm">
              <Text className="font-saira-medium text-lg text-text-1">Loading competitions...</Text>
            </View>
          ) : (
            <>
              {activeCompetitions?.length > 0 && (
                <View>
                  <Text className="mb-2 px-1 font-saira-medium text-2xl text-text-1">
                    Active Competitions
                  </Text>
                  <View className="gap-4">
                    {activeCompetitions.map((instance) => (
                      <CompetitionInstanceCard key={instance.id} instance={instance} />
                    ))}
                  </View>
                </View>
              )}
              {upcomingCompetitions?.length > 0 && (
                <View>
                  <Text className="mb-2 px-1 font-saira-medium text-2xl text-text-1">
                    Upcoming Competitions
                  </Text>
                  <View className="gap-4">
                    {upcomingCompetitions?.map((instance) => (
                      <CompetitionInstanceCard key={instance.id} instance={instance} />
                    ))}
                  </View>
                </View>
              )}
              {completedCompetitions?.length > 0 && (
                <View>
                  <Text className="mb-2 px-1 font-saira-medium text-2xl text-text-1">
                    Completed Competitions
                  </Text>
                  <View className="gap-4">
                    {completedCompetitions?.map((instance) => (
                      <CompetitionInstanceCard key={instance.id} instance={instance} />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
          {currentRole?.type === 'admin' && (
            <View className="gap-2">
              <Heading text="Competition Admin Tools" className="text-text-1" />
              <View className="gap-4">
                <Pressable
                  onPress={() => {
                    if (hasNavigated.current) return;
                    hasNavigated.current = true;
                    setTimeout(() => {
                      hasNavigated.current = false;
                    }, 500); // Reset navigation state after 500ms
                    router.push('/competitions/create-blueprint');
                  }}
                  className="flex-1 flex-row gap-8 rounded-2xl bg-bg-2 p-4 shadow-sm">
                  <View className="flex-1">
                    <Text className="font-saira-medium text-xl text-text-1">Create Blueprint</Text>
                    <Text className="text-md mt-2 font-saira text-text-2">
                      Create a new competition template by defining the structure and rules.
                    </Text>
                  </View>
                  <Ionicons name="construct" size={40} color="#0084ff" />
                </Pressable>
                {currentRole?.activeSeason && (
                  <Pressable
                    onPress={() => {
                      if (hasNavigated.current) return;
                      hasNavigated.current = true;
                      setTimeout(() => {
                        hasNavigated.current = false;
                      }, 500); // Reset navigation state after 500ms
                      router.push('/competitions/initiate-competition');
                    }}
                    className="flex-1 flex-row gap-8 rounded-2xl bg-bg-2 p-4 shadow-sm">
                    <View className="flex-1">
                      <Text className="font-saira-medium text-xl text-text-1">
                        Initiate Competition
                      </Text>
                      <Text className="text-md mt-2 font-saira text-text-2">
                        Initiate a new instance of a competition from an existing template.
                      </Text>
                    </View>
                    <Ionicons name="play-circle" size={40} color="#209e00" />
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
