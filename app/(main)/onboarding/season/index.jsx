import { View, ScrollView } from 'react-native';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import { useUser } from '@contexts/UserProvider';
import LeagueTable from '@components/LeagueTable';
import UpcomingFixtureCard from '@components/UpcomingFixtureCard';
import { useUpcomingFixtures } from '@hooks/useUpcomingFixtures';

const Season = () => {
  const { player, currentRole, roles } = useUser();
  const { data: nextMatch } = useUpcomingFixtures(currentRole?.team?.id, { nextOnly: false });
  console.log('Next Match:', nextMatch);

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useTopInset={false} useBottomInset={false}>
              <CustomHeader
                title="Season Overview"
                showBack={false}
                rightIcon="clipboard-outline"
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-brand"
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        <View className="w-full items-center justify-center rounded bg-brand p-5 pt-0">
          <UpcomingFixtureCard fixture={nextMatch[0]} inactive />
        </View>
        <LeagueTable
          season={currentRole?.activeSeason?.id}
          division={currentRole?.team?.division?.id}
        />
      </ScrollView>
      <NavBar type="onboarding" />
    </SafeViewWrapper>
  );
};

export default Season;
