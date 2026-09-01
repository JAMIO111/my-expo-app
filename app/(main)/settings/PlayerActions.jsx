import { StyleSheet, ScrollView, View, Text, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import useUserProfile from '@/hooks/useUserProfile';
import Avatar from '@components/Avatar';
import MenuContainer from '@components/MenuContainer';
import SettingsItem from '@components/SettingsItem';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

const PlayerId = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentRole, refetch, player } = useUser();
  const { playerId } = useLocalSearchParams();
  const [isPromoting, setisPromoting] = useState(false);
  console.log('Player ID:', playerId);
  const { data: playerProfile, isLoading, error } = useUserProfile?.(playerId);

  const relevantTeam = playerProfile?.teams?.find((team) => team.team_id === currentRole?.team?.id);

  const status = relevantTeam?.status || 'unknown';

  const relevantDate = status === 'active' ? playerProfile?.joined_at : playerProfile?.requested_at;

  console.log('Player Profile:', playerProfile);

  const handlePromoteToCaptain = async () => {
    setisPromoting(true);
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Transfer Captaincy?',
        `Are you sure you want to promote ${playerProfile?.first_name} ${playerProfile?.surname} to team captain? You will instantly lose your captain privileges and access to team management features.`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Promote', onPress: () => resolve(true), style: 'default' },
        ],
        { cancelable: true }
      );
    });
    if (!confirm) return;
    try {
      const { data, error } = await supabase.rpc('transfer_captaincy', {
        p_team_id: currentRole?.team?.id,
        p_new_captain_id: playerId,
      });
      if (error) throw error;
      await queryClient.invalidateQueries(['PlayerProfile', playerId]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Captaincy transferred successfully.',
        text2: `${playerProfile?.first_name} ${playerProfile?.surname} is now the team captain.`,
      });
      router.back();
      router.back();
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error transferring captaincy',
        text2: error.message || 'An error occurred while transferring captaincy.',
      });
    } finally {
      setisPromoting(false);
    }
  };

  const handlePromoteToViceCaptain = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Transfer Vice-Captaincy',
        `Are you sure you want to promote ${playerProfile?.first_name} ${playerProfile?.surname} to vice-captain?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Promote', onPress: () => resolve(true), style: 'default' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      setisPromoting(true);
      const { data, error } = await supabase.rpc('transfer_vice_captaincy', {
        p_team_id: currentRole?.team?.id,
        p_new_vice_captain_id: playerId,
      });
      if (error) throw error;
      await queryClient.invalidateQueries(['PlayerProfile', playerId]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Player promoted to vice-captain successfully.',
        text2: `${playerProfile?.first_name} ${playerProfile?.surname} is now the vice-captain.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error promoting to vice-captain',
        text2: error.message || 'An error occurred while promoting the player to vice-captain.',
      });
    } finally {
      setisPromoting(false);
    }
  };

  const handleRemoveFromTeam = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Confirm Removal',
        `Are you sure you want to remove ${playerProfile?.first_name} ${playerProfile?.surname} from the team?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Remove', onPress: () => resolve(true), style: 'destructive' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      await supabase.rpc('remove_player_from_team', {
        p_team_id: currentRole?.team?.id,
        p_player_id: playerId,
      });
      await queryClient.invalidateQueries(['PlayerProfile', playerId]);
      await queryClient.invalidateQueries(['TeamPlayers', currentRole?.team?.id]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Player removed from the team successfully.',
        text2: `${playerProfile?.first_name} ${playerProfile?.surname} has been removed from the team.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error removing player from the team',
        text2: error.message || 'An error occurred while removing the player from the team.',
      });
    }
  };

  const handleAcceptJoinRequest = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Accept Join Request?',
        `Are you sure you want to accept ${playerProfile?.first_name} ${playerProfile?.surname}'s request to join the team?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Accept', onPress: () => resolve(true), style: 'default' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      await supabase.rpc('accept_join_request', {
        p_team_player_id: relevantTeam?.team_player_id,
      });
      await queryClient.invalidateQueries(['PlayerProfile', playerId]);
      await queryClient.invalidateQueries(['TeamPlayers', currentRole?.team?.id]);
      await queryClient.invalidateQueries([
        'PlayerInvitesAndRequests',
        { teamId: currentRole?.team?.id, playerId },
      ]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Player join request accepted successfully.',
        text2: `${playerProfile?.first_name} ${playerProfile?.surname} has been added to the team.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error accepting player join request',
        text2: error.message || 'An error occurred while accepting the player join request.',
      });
    }
  };

  const formatStatusText = (status) => {
    if (!status) return 'Unknown';

    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={`${playerProfile?.first_name} ${playerProfile?.surname}`} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-bg-grouped-1">
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
          className="flex-1 bg-bg-grouped-1 p-5">
          <View className="mb-8 mt-4 flex-row items-center">
            <View className="overflow-hidden rounded-2xl border-2 border-text-1">
              <Avatar player={playerProfile} size={56} borderRadius={12} />
            </View>
            <View className="ml-4 flex-1">
              <Text style={{ lineHeight: 32 }} className="font-saira-semibold text-2xl text-text-1">
                {playerProfile?.first_name} {playerProfile?.surname}
              </Text>
              <Text className="font-saira-medium text-xl text-text-2">
                {playerProfile?.nickname}
              </Text>
            </View>
          </View>
          <MenuContainer title="Player Details">
            <SettingsItem title="First Name" text={playerProfile?.first_name} />
            <SettingsItem title="Surname" text={playerProfile?.surname} />
            <SettingsItem title="Nickname" text={playerProfile?.nickname} />
            <SettingsItem
              title="Gender"
              text={
                playerProfile?.gender?.slice(0, 1)?.toUpperCase() +
                  playerProfile?.gender?.slice(1) || 'N/A'
              }
            />
            <SettingsItem
              title="DOB"
              text={
                playerProfile?.dob
                  ? new Date(playerProfile.dob)?.toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                  : 'N/A'
              }
            />
          </MenuContainer>
          <MenuContainer title="Team Status">
            <SettingsItem title="Team Name" text={relevantTeam?.team_display_name} />
            {status === 'active' && (
              <SettingsItem title="Role" text={formatStatusText(relevantTeam?.role)} />
            )}
            <SettingsItem title="Status" text={formatStatusText(status)} />
          </MenuContainer>

          <MenuContainer title="Actions">
            {status === 'active' && relevantTeam?.role !== 'captain' && (
              <SettingsItem
                title="Promote to Captain"
                icon="star"
                callbackFn={handlePromoteToCaptain}
              />
            )}
            {status === 'active' && relevantTeam?.role === 'player' && (
              <SettingsItem
                title="Promote to Vice-Captain"
                icon="userStar"
                callbackFn={handlePromoteToViceCaptain}
              />
            )}
            {status === 'active' && currentRole?.role === 'captain' && (
              <SettingsItem
                title="Remove from Team"
                icon="userMinus"
                titleColor="text-[#FF0000]"
                iconColor="#FF0000"
                callbackFn={handleRemoveFromTeam}
              />
            )}
            {(status === 'pending_both' || status === 'pending_captain') &&
              relevantTeam?.requested_at && (
                <SettingsItem
                  title="Accept Join Request"
                  icon="userCheck"
                  titleColor="text-[#178717]"
                  iconColor="#178717"
                  callbackFn={handleAcceptJoinRequest}
                />
              )}
            {(status === 'pending_both' || status === 'pending_captain') &&
              relevantTeam?.requested_at && (
                <SettingsItem
                  title="Deny Join Request"
                  icon="userX"
                  titleColor="text-[#FF0000]"
                  iconColor="#FF0000"
                />
              )}
          </MenuContainer>
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

export default PlayerId;

const styles = StyleSheet.create({});
