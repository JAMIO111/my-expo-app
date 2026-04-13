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
  const { instanceId, fixtureId } = useLocalSearchParams();
  const { data: fixtureDetails, isLoading } = useFixtureDetails(fixtureId);

  console.log('Fixture Details:', fixtureDetails);
  console.log('Current Role in Fixture Page:', currentRole);

  const competitorType = fixtureDetails?.homeCompetitor?.type;

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                title={`${competitorType === 'team' ? fixtureDetails?.homeCompetitor?.abbreviation || '' : fixtureDetails?.homeCompetitor?.nickname.toUpperCase() || ''} vs ${competitorType === 'team' ? fixtureDetails?.awayCompetitor?.abbreviation || '' : fixtureDetails?.awayCompetitor?.nickname.toUpperCase() || ''}`}
                onRightPress={
                  player?.id === currentRole?.team?.captain.id &&
                  currentRole?.team?.id === fixtureDetails?.homeCompetitor?.id &&
                  fixtureDetails?.is_complete === false
                    ? () => router.push(`competitions/${instanceId}/${fixtureId}/submit-results`)
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
          context={`competitions/${instanceId}/${fixtureId}/`}
          fixtureDetails={fixtureDetails}
          isLoading={isLoading}
        />
      </View>
    </SafeViewWrapper>
  );
};

export default index;
