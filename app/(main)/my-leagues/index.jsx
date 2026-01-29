import { StyleSheet, View, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useTeamProfile } from '@hooks/useTeamProfile';
import DivisionsList from '@components/DivisionsList';
import { ScrollView } from 'react-native-gesture-handler';
import CircleButtonRow from '@components/CircleButtonRow';
import CTAButton from '@components/CTAButton';

const index = () => {
  const router = useRouter();
  const { loading, currentRole } = useUser();
  const { data: teamProfile, isLoading } = useTeamProfile(currentRole?.team?.id);

  console.log('Debug Team Profile:', teamProfile);
  console.log('Current Role in My Leagues:', currentRole);

  const handleStartSeason = () => {
    // Logic to start a new season
    console.log('Starting a new season...');
  };

  const handleEndSeason = (seasonId) => {
    // Logic to end the current season
    console.log(`Ending season with ID: ${seasonId}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                rightIcon="settings-outline"
                onRightPress={() => router.push(`/settings`)}
                showBack={false}
                title={currentRole?.district?.name || 'My League'}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView className="mt-16 flex-1 bg-brand px-4">
          <DivisionsList districtId={currentRole?.districtId} />
          <View className="my-4 rounded-2xl bg-bg-1 p-4">
            <Text className="mx-4 font-saira-semibold text-2xl text-text-1">Season</Text>
            <Text className="mx-4 mb-4 font-saira-medium text-text-2">
              {currentRole?.activeSeason
                ? `Current Season: ${currentRole.activeSeason.name}`
                : 'No active season. Start a new season to manage schedules and standings.'}
            </Text>
            <CTAButton
              callbackFn={() =>
                currentRole?.activeSeason
                  ? handleEndSeason(currentRole.activeSeason.id)
                  : handleStartSeason()
              }
              type={currentRole?.activeSeason ? 'error' : 'yellow'}
              text={currentRole?.activeSeason ? 'End Current Season' : 'Start New Season'}
            />
          </View>
          <CircleButtonRow
            format={[
              { color: 'bg-brand-dark', iconColor: 'white', icon: 'add', label: 'District' },
              { color: 'bg-brand-dark', iconColor: 'white', icon: 'add', label: 'Label' },
              { color: 'bg-brand-dark', iconColor: 'white', icon: 'add', label: 'Label' },
              { color: 'bg-brand-dark', iconColor: 'white', icon: 'add', label: 'Label' },
            ]}
          />
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
