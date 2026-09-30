import { View } from 'react-native';
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
import Heading from '@components/Heading';
import { useTheme } from '@contexts/ThemeProvider';

const index = () => {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { currentRole, refetch } = useUser();
  const { data: teamProfile, isLoading } = useTeamProfile(currentRole?.team?.id);

  console.log('Debug Team Profile:', teamProfile);
  console.log('Current Role in My Leagues:', currentRole);

  const handleStartSeason = async () => {
    try {
      const { data, error } = await supabase.rpc('start_new_season', {
        p_district_id: currentRole?.district?.id,
        p_name: null, // the server activates a draft season or names the next one
      });
      if (error) throw error;
      if (data.success === false) {
        const rpcError = new Error(data.message || 'Failed to start the season.');
        rpcError.title = data.title;
        rpcError.code = data.code;
        throw rpcError;
      }
      refetch();
      Toast.show({
        type: 'success',
        text1: 'Season Started',
        text2: 'The season is now active.',
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
        data.incomplete_competitions
          ?.map((c) => `• ${c.name} (${c.reason || c.status})`)
          .join('\n') || 'No details available';

      Toast.show({
        type: 'info',
        text1: 'Season Not Ended',
        text2: `These competitions still need attention:\n\n${list}\n\nFinish them before ending the season.`,
      });

      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Season Ended',
      text2: `${data?.awards_issued ?? 0} awards issued, ${data?.promoted ?? 0} promoted, ${data?.relegated ?? 0} relegated.`,
    });
    refetch();
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
          contentContainerStyle={{
            display: 'flex',
            flexGrow: 1,
            gap: 6,
            backgroundColor: themeColors.bgGrouped1,
          }}
          className="mt-16 flex-1">
          <View className="gap-2 bg-bg-grouped-2 p-4">
            <Heading text="Current Season" />
            <SeasonTicket
              season={currentRole?.activeSeason}
              district={currentRole?.district}
              onStart={handleStartSeason}
              onEnd={handleEndSeason}
            />
          </View>
          <DivisionsList districtId={currentRole?.district?.id} />
          <TeamJoinRequests districtId={currentRole?.district?.id} />
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;
