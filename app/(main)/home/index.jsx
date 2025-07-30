import { Stack } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  RefreshControl,
  Image,
  Pressable,
} from 'react-native';
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
import { useColorScheme } from 'react-native';
import supabase from '@lib/supabaseClient';
import BrandHeader from '@components/BrandHeader';
import HomeScreenCardLarge from '@components/HomeScreenCardLarge';

const Home = () => {
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
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
  console.log('index DivisionId', currentRole?.team?.division?.id);
  console.log('index SeasonId', currentRole?.activeSeason?.id);

  const {
    data: standings,
    isLoading,
    refetch: standingsRefetch,
  } = useStandings(currentRole?.team?.division?.id, currentRole?.activeSeason?.id);

  const {
    data: upcomingFixtures,
    isLoading: isUpcomingFixturesLoading,
    refetch: upcomingFixturesRefetch,
  } = useUpcomingFixtures(currentRole?.team?.id);

  const {
    data: resultsPendingApproval,
    isLoading: isResultsPendingApprovalLoading,
    refetch: resultsPendingApprovalRefetch,
  } = useResultsPendingApproval({
    awayTeamId: currentRole?.team?.id,
    enabled: !!currentRole?.team?.id,
  });

  const {
    data: fixturesAwaitingResults,
    isLoading: isFixturesAwaitingResultsLoading,
    refetch: fixturesAwaitingResultsRefetch,
  } = useFixturesAwaitingResults({
    homeTeamId: currentRole?.team?.id,
    enabled: !!currentRole?.team?.id,
  });

  const handleRecalcStandings = async () => {
    console.log('🟡 Recalc button pressed');
    console.log('Current Role:', currentRole?.activeSeason?.id, currentRole?.team?.division?.id);
    const { error, data } = await supabase.rpc('recalculate_standings', {
      _season_id: currentRole?.activeSeason?.id,
      _division_id: currentRole?.team?.division?.id,
    });

    console.log('RPC data:', data);
    console.log('RPC error:', error);

    if (error) {
      console.error('Failed to recalculate standings:', error.message);
    } else {
      console.log('Standings recalculation data:', data);
      console.log('Standings recalculated successfully');
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
                <BrandHeader />
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
              {currentRole?.team && (
                <>
                  <View className="w-full items-center justify-between">
                    <Text className="mb-2 w-full text-left font-saira-semibold text-xl text-white">
                      {currentRole?.team?.display_name} Fixtures
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
              {(currentRole?.team?.captain === player?.id ||
                currentRole?.team?.vice_captain === player?.id) && (
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
              <View className="w-full gap-3 p-2 pb-20">
                <HomeScreenCardLarge
                  title="Welcome to Break Room!"
                  body="We're so glad you can join us in this community of pool enthusiasts. Click to learn about all the features we have to offer."
                  category="Help & Support"
                  image={require('@assets/pool-table-image.jpg')}
                  onPress={() => {
                    console.log('Card pressed');
                  }}
                />
                <HomeScreenCardLarge
                  title="Upgrade to Pro Membership!"
                  body="Unlock exclusive features such as in depth statistics, advanced match analysis, and the removal of ads for just an extra £0.99/month"
                  category="Membership"
                  image={require('@assets/pool-table-image.jpg')}
                  onPress={() => {
                    console.log('Card pressed');
                  }}
                />
                <CTAButton text="Recalc Standings" callbackFn={handleRecalcStandings} />
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
