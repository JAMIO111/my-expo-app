import { View } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import FixturePage from '@components/FixturePage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import { useUser } from '@contexts/UserProvider';

const index = () => {
  const router = useRouter();
  const { currentRole, player, loading } = useUser();
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
                  (player?.id !== currentRole?.team?.captain ||
                    player?.id === currentRole?.team?.vice_captain) &&
                  currentRole?.team?.id === fixtureDetails?.homeTeam?.id &&
                  fixtureDetails?.is_complete === false
                    ? () => router.push(`home/${fixtureId}/submit-results`)
                    : null
                }
                rightIcon="clipboard-outline"
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="flex-1 bg-brand-dark">
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
