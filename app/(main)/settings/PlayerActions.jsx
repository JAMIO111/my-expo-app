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

  const isMe = player.id === playerId;

  const showPromoteToCaptainButton =
    status === 'active' &&
    relevantTeam?.role !== 'captain' &&
    currentRole?.role === 'captain' &&
    !isMe;

  const showPromoteToViceCaptainButton =
    status === 'active' &&
    relevantTeam?.role === 'player' &&
    currentRole?.role !== 'player' &&
    !isMe;

  const showRemoveFromTeamButton = status === 'active' && currentRole?.role === 'captain' && !isMe;

  const showhandleJoinRequestButton =
    (status === 'pending_both' || status === 'pending_captain') &&
    relevantTeam?.requested_at &&
    currentRole?.role === 'captain' &&
    !isMe;

  const showRevokeInviteButton =
    (status === 'pending_both' || status === 'pending_player' || status === 'pending_admin') &&
    relevantTeam?.invited_by &&
    currentRole?.role === 'captain' &&
    !isMe;

  const showActionsSection =
    showPromoteToCaptainButton ||
    showPromoteToViceCaptainButton ||
    showRemoveFromTeamButton ||
    showhandleJoinRequestButton ||
    showRevokeInviteButton;

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
      const { data, error } = await supabase.rpc('remove_team_player', {
        p_team_id: currentRole?.team?.id,
        p_player_id: playerId,
      });
      if (error) throw error;
      if (data.success === false) {
        const rpcError = new Error(data.message || 'Failed to remove player from the team.');
        rpcError.title = data.title;
        rpcError.code = data.code;
        throw rpcError;
      }

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
        text1: error.title || 'Error removing player from the team',
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
      await supabase.rpc('accept_player_join_team_request', {
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
        text1: 'Join request accepted successfully.',
        text2: `${playerProfile?.first_name} ${playerProfile?.surname} has been added to the team.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Failed to accept join request',
        text2: error.message || 'An error occurred while accepting the player join request.',
      });
    }
  };

  const handleDeclineJoinRequest = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Decline Join Request?',
        `Are you sure you want to decline ${playerProfile?.first_name} ${playerProfile?.surname}'s request to join the team?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Decline', onPress: () => resolve(true), style: 'destructive' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      await supabase.rpc('decline_player_join_team_request', {
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
        text1: 'Join request declined successfully.',
        text2: `${playerProfile?.first_name} ${playerProfile?.surname}'s request to join the team has been declined.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Failed to decline join request',
        text2: error.message || 'An error occurred while declining the player join request.',
      });
    }
  };

  const handleRevokeInvite = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Revoke Invite?',
        `Are you sure you want to revoke the invite sent to ${playerProfile?.first_name} ${playerProfile?.surname}?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Revoke', onPress: () => resolve(true), style: 'destructive' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      await supabase.rpc('revoke_player_join_team_invite', {
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
        text1: 'Invite revoked successfully.',
        text2: `The invite sent to ${playerProfile?.first_name} ${playerProfile?.surname} has been revoked.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Failed to revoke invite',
        text2: error.message || 'An error occurred while revoking the player invite.',
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
      <View className="mt-16 flex-1 bg-bg-grouped-1 pb-12">
        <View
          style={{
            borderColor: status === 'active' ? 'green' : status === 'left' ? 'gray' : 'orange',
            backgroundColor:
              status === 'active' ? '#E6F4EA' : status === 'left' ? '#F0F0F0' : '#FFF4E5',
          }}
          className="flex-row items-center gap-6 border-b bg-bg-1 p-3 px-6">
          <Avatar player={playerProfile} size={46} borderRadius={10} />
          <View className="flex-1 gap-1">
            <Text className="flex-1 text-left font-tektur-medium text-xl text-text-1">
              {status === 'active'
                ? 'Active Player'
                : status === 'left'
                  ? 'Former Player'
                  : relevantTeam?.requested_by
                    ? 'Requested to Join'
                    : relevantTeam?.invited_by
                      ? 'Player Invited'
                      : ''}
            </Text>
            <Text className="flex-1 text-left font-tektur-medium text-lg text-text-2">
              {(() => {
                switch (status) {
                  case 'active':
                    return `Joined on ${new Date(relevantTeam?.joined_at).toLocaleDateString(
                      'en-GB',
                      {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      }
                    )}`;
                  case 'left':
                    return `Left on ${new Date(relevantTeam?.left_at).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}`;
                  case 'pending_both':
                    return relevantTeam?.requested_by
                      ? 'Pending Admin & Captain'
                      : relevantTeam?.invited_by
                        ? 'Pending Admin & Player'
                        : 'Pending Both';
                  case 'pending_captain':
                    return 'Pending Captain';
                  case 'pending_player':
                    return 'Pending Player';
                  case 'pending_admin':
                    return 'Pending Admin';
                  default:
                    return `Status: ${formatStatusText(status)}`;
                }
              })()}
            </Text>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
          className="flex-1 bg-bg-grouped-1 p-5">
          <MenuContainer title="Player Details">
            <SettingsItem
              title="First Name"
              icon="userPen"
              text={playerProfile?.first_name || 'N/A'}
            />
            <SettingsItem title="Surname" icon="userPen" text={playerProfile?.surname || 'N/A'} />
            <SettingsItem title="Nickname" icon="userPen" text={playerProfile?.nickname || 'N/A'} />
            <SettingsItem
              title="Gender"
              icon="venusAndMars"
              text={
                playerProfile?.gender?.slice(0, 1)?.toUpperCase() +
                  playerProfile?.gender?.slice(1) || 'N/A'
              }
            />
            <SettingsItem
              title="DOB"
              icon="calendar"
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
            <SettingsItem
              title="Team Name"
              icon="folderPen"
              text={relevantTeam?.team_display_name}
            />
            {status === 'active' && (
              <SettingsItem
                title="Role"
                icon="userStar"
                text={formatStatusText(relevantTeam?.role)}
              />
            )}
            <SettingsItem
              title="Join Method"
              icon="mailQuestionMark"
              text={
                relevantTeam?.requested_by
                  ? 'Requested to Join'
                  : relevantTeam?.invited_by
                    ? 'Invited to Join'
                    : 'N/A'
              }
            />
            <SettingsItem title="Status" icon="circleCheck" text={formatStatusText(status)} />
            {status === 'active' && relevantTeam?.joined_at && (
              <SettingsItem
                title="Joined On"
                icon="handshake"
                text={new Date(relevantTeam?.joined_at).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            )}
          </MenuContainer>

          {showActionsSection && (
            <MenuContainer title="Actions">
              {showPromoteToCaptainButton && (
                <SettingsItem
                  title="Promote to Captain"
                  icon="star"
                  callbackFn={handlePromoteToCaptain}
                />
              )}
              {showPromoteToViceCaptainButton && (
                <SettingsItem
                  title="Promote to Vice-Captain"
                  icon="userStar"
                  callbackFn={handlePromoteToViceCaptain}
                />
              )}
              {showRemoveFromTeamButton && (
                <SettingsItem
                  title="Remove from Team"
                  icon="userMinus"
                  titleColor="text-[#FF0000]"
                  iconColor="#FF0000"
                  callbackFn={handleRemoveFromTeam}
                />
              )}
              {showhandleJoinRequestButton && (
                <SettingsItem
                  title="Accept Join Request"
                  icon="userCheck"
                  titleColor="text-[#178717]"
                  iconColor="#178717"
                  callbackFn={handleAcceptJoinRequest}
                />
              )}
              {showhandleJoinRequestButton && (
                <SettingsItem
                  title="Decline Join Request"
                  icon="userX"
                  titleColor="text-[#FF0000]"
                  iconColor="#FF0000"
                  callbackFn={handleDeclineJoinRequest}
                />
              )}
              {showRevokeInviteButton && (
                <SettingsItem
                  title="Revoke Invite"
                  icon="mailX"
                  titleColor="text-[#FF0000]"
                  iconColor="#FF0000"
                  callbackFn={handleRevokeInvite}
                />
              )}
            </MenuContainer>
          )}
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

export default PlayerId;

const styles = StyleSheet.create({});
