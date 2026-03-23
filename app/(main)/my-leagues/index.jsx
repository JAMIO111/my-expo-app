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
import SeasonControlCard from '../../components/SeasonControlCard';

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
                onRightPress={() => {
                  router.push(`/settings`);
                  console.log('Settings button pressed');
                }}
                showBack={false}
                title={currentRole?.district?.name || 'My League'}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 16 }}
          className="mt-16 flex-1 bg-brand pt-6">
          <View className="px-4">
            <SeasonControlCard
              activeSeason={currentRole?.activeSeason}
              onStart={handleStartSeason}
              onEnd={handleEndSeason}
              loading={isLoading || loading}
            />
          </View>
          <View className="bg-bg-2 p-3">
            <DivisionsList districtId={currentRole?.district.id} />
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
