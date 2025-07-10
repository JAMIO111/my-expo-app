import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import FixturePage from '@components/FixturePage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import { useUser } from '@contexts/UserProvider';

const index = () => {
  const router = useRouter();
  const { player, loading } = useUser();
  const { fixtureId } = useLocalSearchParams();
  const { data: fixtureDetails, isLoading } = useFixtureDetails(fixtureId);
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                title={`${fixtureDetails?.homeTeam?.abbreviation} vs ${fixtureDetails?.awayTeam?.abbreviation}`}
                onRightPress={
                  fixtureDetails?.home_team === player?.team.id &&
                  !fixtureDetails?.is_complete &&
                  (player?.team?.captain === player?.id ||
                    player?.team?.vice_captain === player?.id)
                    ? () => router.push(`home/${fixtureId}/submit-results`)
                    : null
                }
                rightIcon="clipboard-outline"
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="flex-1">
        <FixturePage
          context="home/upcoming-fixture"
          fixtureDetails={fixtureDetails}
          isLoading={isLoading}
        />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
