import { StyleSheet, View } from 'react-native';
import { Cog } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@lib/supabase';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useTeamProfile } from '@hooks/useTeamProfile';
import DivisionsList from '@components/DivisionsList';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import TeamJoinRequests from '@components/TeamJoinRequests';
import SeasonTicket from '@components/SeasonTicket';

const index = () => {
  const router = useRouter();
  const { currentRole, refetch } = useUser();
  const { data: teamProfile, isLoading } = useTeamProfile(currentRole?.team?.id);

  console.log('Debug Team Profile:', teamProfile);
  console.log('Current Role in My Leagues:', currentRole);

  const handleStartSeason = async () => {
    try {
      const { data, error } = await supabase.rpc('start_new_season', {
        p_district_id: currentRole?.district?.id,
        p_name: '2029/30',
      });
      if (error) throw error;
      if (data.success === false) {
        const rpcError = new Error(data.message || 'Failed to remove player from the team.');
        rpcError.title = data.title;
        rpcError.code = data.code;
        throw rpcError;
      }
      refetch();
      Toast.show({
        type: 'success',
        text1: 'Season Started',
        text2: 'A new season has been created.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error.title || 'Error Starting Season',
        text2: error.message || 'An unexpected error occurred.',
      });
    }
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
                rightIcon={Cog}
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
          contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 5 }}
          className="mt-16 flex-1">
          <View className="bg-bg-1 p-4">
            <SeasonTicket
              season={currentRole?.activeSeason}
              district={currentRole?.district}
              onStart={handleStartSeason}
              onEnd={handleEndSeason}
            />
          </View>
          <DivisionsList districtId={currentRole?.district.id} />
          <TeamJoinRequests districtId={currentRole?.district.id} />
          <View className="bg-bg-1 p-4"></View>
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;
