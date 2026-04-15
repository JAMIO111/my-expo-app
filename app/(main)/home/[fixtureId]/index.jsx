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

  console.log('Fixture Details:', fixtureDetails);
  console.log('Current Role in Fixture Page:', currentRole);

  const competitorType = fixtureDetails?.homeCompetitor?.type;

  const isOpen = !fixtureDetails?.is_complete;

  const isDisputedEditable = fixtureDetails?.is_disputed && !fixtureDetails?.is_amended;

  const fixtureValid = isOpen || isDisputedEditable;

  const playerValid =
    competitorType === 'team'
      ? player?.id === currentRole?.team?.captain &&
        currentRole?.team.id === fixtureDetails?.homeCompetitor?.id
      : player?.id === fixtureDetails?.homeCompetitor?.id;

  const canSubmit = fixtureValid && playerValid;

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                title={`${competitorType === 'team' ? fixtureDetails?.homeCompetitor?.abbreviation || '' : fixtureDetails?.homeCompetitor?.nickname.toUpperCase() || ''} vs ${competitorType === 'team' ? fixtureDetails?.awayCompetitor?.abbreviation || '' : fixtureDetails?.awayCompetitor?.nickname.toUpperCase() || ''}`}
                onRightPress={
                  canSubmit ? () => router.push(`home/${fixtureId}/submit-results`) : null
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
