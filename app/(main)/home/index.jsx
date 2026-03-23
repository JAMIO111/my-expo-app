import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, Platform, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useUser } from '@contexts/UserProvider';
import LoadingScreen from '@components/LoadingScreen';
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
import { supabase } from '@/lib/supabase';
import BrandHeader from '@components/BrandHeader';
import HomeScreenCardLarge from '@components/HomeScreenCardLarge';
import TransferWindowCard from '@components/TransferWindowCard';
import ToggleTransferWindowCard from '@components/ToggleTransferWindowCard';
import { useQueryClient } from '@tanstack/react-query';

const Home = () => {
  const [windowLoading, setWindowLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {
    user,
    player,
    roles,
    currentRole,
    loading: isUserLoading,
    fetching,
    isError,
    refetch,
  } = useUser();
  const queryClient = useQueryClient();

  console.log('User:', user);
  console.log('Player:', player);
  console.log('Current Role:', currentRole);
  console.log('Roles:', roles);
  console.log('Is User Loading:', isUserLoading);
  console.log('Is Error:', isError);
  console.log('index DivisionId', currentRole?.division?.id);
  console.log('index SeasonId', currentRole?.activeSeason?.id);

  const divisionId =
    currentRole?.role === 'admin'
      ? currentRole?.competitions?.filter((comp) => comp.division_tier === 1)?.[0]?.division_id
      : currentRole?.division?.id;
  console.log('Division ID:', divisionId);

  const {
    data: standings,
    isLoading: isStandingsLoading,
    refetch: standingsRefetch,
  } = useStandings(divisionId, currentRole?.activeSeason?.id);

  console.log('Standings:', standings);

  const {
    data: upcomingFixtures,
    isLoading: isUpcomingFixturesLoading,
    refetch: upcomingFixturesRefetch,
  } = useUpcomingFixtures(currentRole?.team?.id);

  const {
    data: teamResultsPendingApproval,
    isLoading: isTeamResultsPendingApprovalLoading,
    refetch: teamResultsPendingApprovalRefetch,
  } = useResultsPendingApproval({
    competitorId: currentRole?.team?.id,
    competitorType: 'team',
    enabled: !!currentRole?.team?.id,
  });

  const {
    data: playerResultsPendingApproval,
    isLoading: isPlayerResultsPendingApprovalLoading,
    refetch: playerResultsPendingApprovalRefetch,
  } = useResultsPendingApproval({
    competitorId: player?.id,
    competitorType: 'player',
    enabled: !!player?.id,
  });

  const resultsPendingApproval = [
    ...(teamResultsPendingApproval || []),
    ...(playerResultsPendingApproval || []),
  ].sort((a, b) => new Date(b.date_time) - new Date(a.date_time)); // sort by date descending

  const {
    data: teamFixturesAwaitingResults,
    isLoading: isTeamFixturesAwaitingResultsLoading,
    refetch: fixturesAwaitingResultsRefetch,
  } = useFixturesAwaitingResults({
    competitorId: currentRole?.team?.id,
    competitorType: 'team',
    enabled: !!currentRole?.team?.id,
  });

  const {
    data: playerFixturesAwaitingResults,
    isLoading: isPlayerFixturesAwaitingResultsLoading,
    refetch: playerFixturesAwaitingResultsRefetch,
  } = useFixturesAwaitingResults({
    competitorId: player?.id,
    competitorType: 'player',
    enabled: !!player?.id,
  });

  const fixturesAwaitingResults = [
    ...(teamFixturesAwaitingResults || []),
    ...(playerFixturesAwaitingResults || []),
  ].sort((a, b) => new Date(b.date_time) - new Date(a.date_time)); // sort by date descending

  console.log('Team Fixtures Awaiting Results:', teamFixturesAwaitingResults);
  console.log('Player Fixtures Awaiting Results:', playerFixturesAwaitingResults);
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
        <LoadingScreen />
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
            <View className="w-full items-center justify-center gap-4 p-0 pb-5">
              {currentRole?.team && (
                <>
                  <View className="w-full items-center justify-between">
                    <Text className="mb-2 w-full px-3 text-left font-saira-semibold text-xl text-white">
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
              <View className="w-full items-center justify-center gap-4 px-3">
                <FixturesHomeCard
                  fixture={upcomingFixtures?.[0]}
                  isLoading={isUpcomingFixturesLoading}
                />
                <ResultsHomeCard
                  result={upcomingFixtures?.filter((result) => result.approved)?.[0]}
                  isLoading={isUpcomingFixturesLoading}
                />
                <LeagueHomeCard standings={standings} isLoading={isStandingsLoading} />
              </View>
            </View>
            <View className="w-full bg-bg-grouped-2 pb-24">
              {(currentRole?.team?.captain === player?.id ||
                currentRole?.team?.vice_captain === player?.id) && (
                <View className="w-full bg-bg-grouped-1">
                  {resultsPendingApproval &&
                    resultsPendingApproval.length > 0 &&
                    resultsPendingApproval.map((fixture) => (
                      <PendingResultCard
                        key={fixture.id}
                        fixture={fixture}
                        refetch={teamResultsPendingApprovalRefetch}
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
              <View className="w-full gap-5 p-3 pb-20 pt-5">
                {currentRole.type === 'player' && currentRole.district?.transfer_window_open ? (
                  <TransferWindowCard />
                ) : currentRole.type === 'admin' ? (
                  <ToggleTransferWindowCard
                    loading={fetching}
                    isOpen={currentRole.district?.transfer_window_open}
                    onToggle={async () => {
                      setWindowLoading(true);
                      try {
                        const { data, error } = await supabase
                          .from('Districts')
                          .update({
                            transfer_window_open: !currentRole.district?.transfer_window_open,
                          })
                          .eq('id', currentRole.district.id);
                        // Invalidate related queries to ensure UI updates with latest data
                        queryClient.invalidateQueries(['authUserProfile']);
                        if (error) {
                          console.error('Error updating transfer window:', error);
                        } else {
                          console.log('Transfer window updated successfully:', data);
                        }
                      } catch (err) {
                        console.error('Unexpected error updating transfer window:', err);
                      } finally {
                        setWindowLoading(false);
                      }
                    }}
                  />
                ) : null}
                <HomeScreenCardLarge
                  title="Welcome to Break Room!"
                  body="We're so glad you can join us in this community of pool enthusiasts. Click to learn about all the features we have to offer."
                  category="Help & Support"
                  image={require('@assets/pool-table-image.jpg')}
                  onPress={() => {
                    router.push('/(main)/home/help');
                  }}
                />
                <HomeScreenCardLarge
                  title="Upgrade to Pro Membership!"
                  body="Unlock exclusive features such as in depth statistics, advanced match analysis, and the removal of ads for just an extra £0.99/month"
                  category="Membership"
                  image={require('@assets/premium-card.jpg')}
                  onPress={() => {
                    router.push('/(main)/home/premium');
                  }}
                />
                <CTAButton
                  text="Check Badges"
                  callbackFn={async () => {
                    try {
                      const { data, error } = await supabase.rpc('check_player_badges', {
                        _player_id: player.id,
                      });
                      if (error) {
                        console.error('Badge check RPC error:', error);
                      } else {
                        console.log('Badge check RPC success:', data);
                      }
                    } catch (err) {
                      console.error('Unexpected error calling badge check RPC:', err);
                    }
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
