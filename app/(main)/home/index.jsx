import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, Image, View, ScrollView, Platform, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useUser } from '@contexts/UserProvider';
import LoadingSplash from '@components/LoadingSplash';
import HorizontalScrollUpcomingFixtures from '@components/HorizontalScrollUpcomingFixtures';
import CTAButton from '@components/CTAButton';
import ResultsHomeCard from '@components/ResultsHomeCard';
import LeagueHomeCard from '@components/LeagueHomeCard';
import FixturesHomeCard from '@components/FixturesHomeCard';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useUpcomingFixtures } from '@hooks/useUpcomingFixtures';
import { StatusBar } from 'expo-status-bar';
import { useStandings } from '@hooks/useStandings';
import PendingResultCard from '@components/PendingResultCard';
import AwaitingResultCard from '@components/AwaitingResultCard';
import { useResultsPendingApproval } from '@hooks/useResultsPendingApproval';
import { useFixturesAwaitingResults } from '@hooks/useFixturesAwaitingResults';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile2';

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const {
    user,
    player,
    roles,
    currentRole,
    setCurrentRole,
    loading: isUserLoading,
    isError,
    refetch,
  } = useUser();
  console.log('User:', user);
  console.log('Player:', player);
  console.log('Current Role:', currentRole);
  console.log('Roles:', roles);
  console.log('Is User Loading:', isUserLoading);
  console.log('Is Error:', isError);

  console.log('DivisionID', player?.team?.division?.id);
  console.log('SeasonId', player?.activeSeason?.id);

  const {
    data: standings,
    isLoading,
    refetch: standingsRefetch,
  } = useStandings(player?.team?.division?.id, player?.activeSeason?.id);

  const {
    data: upcomingFixtures,
    isLoading: isUpcomingFixturesLoading,
    refetch: upcomingFixturesRefetch,
  } = useUpcomingFixtures(player?.team?.id);

  const {
    data: resultsPendingApproval,
    isLoading: isResultsPendingApprovalLoading,
    refetch: resultsPendingApprovalRefetch,
  } = useResultsPendingApproval({ awayTeamId: player?.team?.id, enabled: !!player?.team?.id });

  const {
    data: fixturesAwaitingResults,
    isLoading: isFixturesAwaitingResultsLoading,
    refetch: fixturesAwaitingResultsRefetch,
  } = useFixturesAwaitingResults({
    homeTeamId: player?.team?.id,
    enabled: !!player?.team?.id,
  });

  const handleGetUser = () => {
    console.log('Button pressed ✅');

    if (data) {
      console.log('User Profile:', data);
    } else {
      refetch()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error during refetch:', error);
          } else {
            console.log('User Profile (refetched):', data);
          }
        })
        .catch((err) => {
          console.error('Unexpected error:', err);
        });
    }
  };

  console.log('Fixtures Awaiting Results:', fixturesAwaitingResults);
  console.log('Upcoming Fixtures:', upcomingFixtures);
  console.log('Results Pending Approval:', resultsPendingApproval);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    standingsRefetch()
      .then(() => {
        upcomingFixturesRefetch();
      })
      .then(() => {
        return new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [upcomingFixturesRefetch]);

  if (!player) {
    return (
      <>
        <Stack.Screen
          options={{
            header: () => (
              <View className="h-16 flex-row items-center justify-center bg-brand"></View>
            ),
          }}
        />
        <LoadingSplash />
      </>
    );
  }

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); // hide picker immediately on Android
    }

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <View className="flex-1">
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useBottomInset={false}>
                <View className="h-16 flex-row items-center justify-center bg-brand">
                  <Text className="font-michroma text-2xl font-bold text-white">Break</Text>
                  <Image
                    source={require('@assets/Break-Room-Logo-1024-Background.png')}
                    className="mx-1 h-12 w-12"
                    resizeMode="contain"
                  />
                  <Text className="font-michroma text-2xl font-bold text-white">Room</Text>
                </View>
              </SafeViewWrapper>
            ),
          }}
        />

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#fff']} // Android spinner color
              tintColor="#fff" // iOS spinner color
            />
          }
          className="mt-16 flex-1 bg-brand"
          contentContainerStyle={{ allignItems: 'center', justifyContent: 'center' }}>
          <View className="">
            <View className="w-full items-center justify-center gap-4 p-3 pb-5">
              {player?.team && (
                <>
                  <View className="w-full items-center justify-between">
                    <Text className="mb-2 w-full text-left font-saira-semibold text-xl text-white">
                      {player.team.name} Fixtures
                    </Text>
                    <HorizontalScrollUpcomingFixtures
                      fixtures={upcomingFixtures}
                      isLoading={isUpcomingFixturesLoading}
                    />
                  </View>
                  <View className="mb-2 h-1 w-full items-center justify-between border-b border-brand-light"></View>
                </>
              )}
              <FixturesHomeCard fixtures={upcomingFixtures} isLoading={isUpcomingFixturesLoading} />
              <ResultsHomeCard />
              <LeagueHomeCard standings={standings} />
            </View>
            <View className="w-full gap-4 bg-bg-grouped-1 pb-24">
              {(player?.team?.captain === player?.id ||
                player?.team?.vice_captain === player?.id) && (
                <View className="w-full bg-bg-grouped-1">
                  {resultsPendingApproval &&
                    resultsPendingApproval.length > 0 &&
                    resultsPendingApproval.map((fixture) => (
                      <PendingResultCard
                        key={fixture.id}
                        fixture={fixture}
                        refetch={resultsPendingApprovalRefetch}
                      />
                    ))}
                  <View className="w-full bg-bg-grouped-1">
                    {fixturesAwaitingResults &&
                      fixturesAwaitingResults.length > 0 &&
                      fixturesAwaitingResults.map((fixture) => (
                        <AwaitingResultCard
                          key={fixture.id}
                          fixture={fixture}
                          refetch={fixturesAwaitingResultsRefetch}
                        />
                      ))}
                  </View>
                </View>
              )}
              <View className="w-full gap-4 p-3 pb-20">
                <CTAButton text="View Players" callbackFn={() => router.push('/home/fixtures')} />
                <CTAButton text="View Teams" callbackFn={() => router.push('/home/fixtures')} />
                <CTAButton text="View Fixtures" callbackFn={() => router.push('/home/fixtures')} />
                <CTAButton text="Get User" callbackFn={handleGetUser} />
                <CTAButton
                  text="Switch Context"
                  callbackFn={() => {
                    setCurrentRole(roles[1]);
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
        <NavBar />
      </View>
    </SafeViewWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({});
