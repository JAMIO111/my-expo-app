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
import supabase from '@lib/supabaseClient';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import NavBar from '@components/NavBar';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useUpcomingFixtures } from '@hooks/useUpcomingFixtures';
import { StatusBar } from 'expo-status-bar';

const Home = () => {
  const { colorScheme } = useColorScheme();
  const [fixtures, setFixtures] = useState([]);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { player } = useUser();
  console.log('User:', player);

  const {
    data: upcomingFixtures,
    isLoading: isUpcomingFixturesLoading,
    refetch: upcomingFixturesRefetch,
  } = useUpcomingFixtures(player?.team?.id);

  console.log('Upcoming Fixtures:', upcomingFixtures);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    upcomingFixturesRefetch()
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
            <View className="w-full items-center justify-center gap-3 p-3 pb-4">
              <View className="w-full items-center justify-between">
                <Text className="w-full text-left text-xl font-bold text-white">
                  {player.team.name} Fixtures
                </Text>
                <HorizontalScrollUpcomingFixtures
                  fixtures={upcomingFixtures}
                  isLoading={isUpcomingFixturesLoading}
                />
              </View>
              <View className="my-2 h-1 w-full items-center justify-between border-b border-brand-light"></View>
              <FixturesHomeCard fixtures={upcomingFixtures} isLoading={isUpcomingFixturesLoading} />
              <ResultsHomeCard />
              <LeagueHomeCard />
            </View>
            <View className="w-full gap-3 bg-background-dark p-3 pb-10">
              <CTAButton
                type="success"
                text="Teams"
                callbackFn={() => router.push(`/teams/${player.team.id}`)}
              />
              <CTAButton type="success" text="Players" callbackFn={() => router.push('/results')} />

              <View>
                {fixtures.map((fixture, index) => (
                  <Text key={index} className="text-text-1">
                    {fixture.home} vs {fixture.away} on{' '}
                    {new Date(fixture.datetime).toLocaleString('en-GB', {
                      timeZone: 'Europe/London', // correct local time incl. BST
                      hour: '2-digit',
                      minute: '2-digit',
                      weekday: 'long',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                ))}
              </View>

              <CTAButton
                type="error"
                text={isSigningOut ? 'Signing Out...' : 'Sign Out'}
                callbackFn={async () => {
                  setIsSigningOut(true);
                  const { error } = await supabase.auth.signOut();
                  setIsSigningOut(false);

                  if (error) {
                    console.error('Error signing out:', error.message);
                    // show toast or alert
                  } else {
                    Toast.show({
                      type: 'success',
                      text1: 'Signed Out',
                      text2: 'You have successfully signed out.',
                      props: {
                        colorScheme: colorScheme,
                      },
                    });
                    router.replace('/login'); // Redirect to login page after sign out
                  }
                }}
                disabled={isSigningOut}
              />
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
