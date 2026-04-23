import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@lib/supabase';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useTeamProfile } from '@hooks/useTeamProfile';
import DivisionsList from '@components/DivisionsList';
import { ScrollView } from 'react-native-gesture-handler';
import SeasonControlCard from '@components/SeasonControlCard';
import Toast from 'react-native-toast-message';
import AdminRequests from '@components/AdminRequests';

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

  const handleEndSeason = async (seasonId) => {
    const { data, error } = await supabase.rpc('end_season', {
      p_season_id: seasonId,
    });

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error Ending Season',
        text2: error.message,
      });
      return;
    }

    if (data?.success === false) {
      const list =
        data.incomplete_competitions?.map((c) => `• ${c.name} (${c.status})`).join('\n') ||
        'No details available';

      Toast.show({
        type: 'info',
        text1: 'Season Not Ended',
        text2: `The following competitions are still active:\n\n${list}\n\nPlease complete them all before ending the season.`,
      });

      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Season Ended',
      text2: 'The season has been successfully ended.',
    });
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
          contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 4 }}
          className="mt-16 flex-1">
          <DivisionsList districtId={currentRole?.district.id} />
          <AdminRequests districtId={currentRole?.district.id} />
          <View className="bg-brand p-4">
            <SeasonControlCard
              activeSeason={currentRole?.activeSeason}
              onStart={handleStartSeason}
              onEnd={handleEndSeason}
              loading={isLoading || loading}
            />
          </View>
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
