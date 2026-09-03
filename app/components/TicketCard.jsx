import { useState } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { shiftLightness } from '@lib/helperFunctions';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';

const NOTCH_DEFAULT = 22;

export default function TicketCard({ item, style }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [handling, setHandling] = useState(false);
  const { currentRole, refetch, player } = useUser();

  const [fontsLoaded] = useFonts({
    Barcode128: require('../assets/fonts/LibreBarcode128-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  const handleAcceptTeamInvite = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Accept Invite?',
        `Are you sure you want to accept ${item?.invited_by?.first_name} ${item?.invited_by?.surname}'s invitation to join the team?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Accept', onPress: () => resolve(true), style: 'default' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      await supabase.rpc('accept_player_join_team_invite', {
        p_team_player_id: item?.id,
      });
      await queryClient.invalidateQueries(['PlayerProfile', player?.id]);
      await queryClient.invalidateQueries(['TeamPlayers', currentRole?.team?.id]);
      await queryClient.invalidateQueries([
        'PlayerInvitesAndRequests',
        { teamId: currentRole?.team?.id, playerId: player?.id },
      ]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Join request accepted successfully.',
        text2: `${item?.first_name} ${item?.surname} has been added to the team.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Failed to accept invite',
        text2: error.message || 'An error occurred while accepting the player invite.',
      });
    }
  };

  const handleDeclineTeamInvite = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Decline Invite?',
        `Are you sure you want to decline ${item?.invited_by?.first_name} ${item?.invited_by?.surname}'s invitation to join the team?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Decline', onPress: () => resolve(true), style: 'destructive' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      await supabase.rpc('decline_player_join_team_invite', {
        p_team_player_id: item?.id,
      });
      await queryClient.invalidateQueries(['PlayerProfile', player?.id]);
      await queryClient.invalidateQueries(['TeamPlayers', currentRole?.team?.id]);
      await queryClient.invalidateQueries([
        'PlayerInvitesAndRequests',
        { teamId: currentRole?.team?.id, playerId: player?.id },
      ]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Invite declined successfully.',
        text2: `${playerProfile?.first_name} ${playerProfile?.surname} has been removed from the team.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Failed to decline invite',
        text2: error.message || 'An error occurred while declining the player invite.',
      });
    }
  };

  const handleRevokeRequest = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Revoke Request?',
        `Are you sure you want to revoke your request to join ${item?.team?.display_name}?`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Yes, Revoke', onPress: () => resolve(true), style: 'destructive' },
        ],
        { cancelable: false }
      );
    });
    if (!confirm) return;
    try {
      await supabase.rpc('revoke_player_join_team_request', {
        p_team_id: item?.team?.id,
        p_player_id: player?.id,
      });
      await queryClient.invalidateQueries(['PlayerProfile', player?.id]);
      await queryClient.invalidateQueries(['TeamPlayers', currentRole?.team?.id]);
      await queryClient.invalidateQueries([
        'PlayerInvitesAndRequests',
        { teamId: currentRole?.team?.id, playerId: player?.id },
      ]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Request revoked successfully.',
        text2: `Your request to join ${item?.team?.display_name} has been revoked.`,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Failed to revoke request',
        text2: error.message || 'An error occurred while revoking your request.',
      });
    }
  };

  let barcodeValue = 'aoslijrgopwijgpw';
  let footerLabel = 'Ticket ID: ' + item?.id;
  let eyebrow = '';
  let eyebrowSub = '';
  let title = item?.title || 'Ticket Title';
  let textColor = '#F7F5F0';
  let accentColor = '#fff';
  let leftButtonLabel = '';
  let rightButtonLabel = '';
  const notchSize = NOTCH_DEFAULT;
  let stubLabel = `Press the button below to handle the ticket.`;
  let buttonLabel = 'Handle Ticket';
  const requirements = item?.requirements || [];
  let handleRightButtonPress = null;
  let handleLeftButtonPress = null;

  switch (`${item?.context}-${item?.type}`) {
    case 'team-invite':
      barcodeValue = item?.team_player_id;
      accentColor = '#C96F3F';
      eyebrow = 'Team Invitation';
      eyebrowSub = `From ${item?.invited_by?.first_name} ${item?.invited_by?.surname}`;
      title = `You have been invited to join ${item?.team?.display_name}`;
      leftButtonLabel = 'Decline Invite';
      rightButtonLabel = 'Accept Invite';
      buttonLabel = 'Handle Invite';
      handleLeftButtonPress = handleDeclineTeamInvite;
      handleRightButtonPress = handleAcceptTeamInvite;
      footerLabel = 'Invite issued on ' + new Date(item?.invited_at).toLocaleDateString();
      break;
    case 'team-request':
      barcodeValue = item?.team_player_id;
      accentColor = '#b078f5';
      eyebrow = 'Team Join Request';
      eyebrowSub = `By ${item?.requested_by_player?.first_name} ${item?.requested_by_player?.surname}`;
      title = `You made a request to join ${item?.team?.display_name}`;
      buttonLabel = 'Handle Request';
      leftButtonLabel = 'Revoke Request';
      rightButtonLabel = null;
      handleLeftButtonPress = handleRevokeRequest;
      footerLabel = 'Request made on ' + new Date(item?.requested_at).toLocaleDateString();
      break;
    default:
      break;
  }

  const fg = textColor ?? getContrastText(accentColor);
  const dashColor = hexWithAlpha(fg, 0.35);
  const darkenedAccent = shiftLightness(accentColor, -6);
  const notchColor = 'bg-bg-2';

  return (
    <View
      className="w-full overflow-hidden rounded-[18px] shadow-sm"
      style={[{ backgroundColor: accentColor, height: 510 }, style]}>
      {/* ---- Top stub ---- */}
      <View style={[{ backgroundColor: darkenedAccent }]} className="px-[18px] pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className="font-saira-bold text-[14px] tracking-wide"
              style={{ color: hexWithAlpha(fg, 0.85) }}>
              {eyebrow}
            </Text>
            <Text
              className="font-saira-medium text-[12px]"
              style={{ color: hexWithAlpha(fg, 0.7) }}>
              {eyebrowSub}
            </Text>
          </View>
          <Image
            source={require('../assets/BR-Logo-1024-No-Background.png')}
            style={{ width: 40, height: 40 }}
          />
        </View>
      </View>

      <View className="flex-1 px-4 py-4">
        <Text className="flex-1 font-michroma" style={{ color: fg, fontSize: 26, lineHeight: 40 }}>
          {title}
        </Text>
      </View>

      {/* ---- Perforation with tear notches ---- */}
      <View style={{ height: notchSize }} className="justify-center">
        <View
          className={`absolute top-1/2 z-10 ${notchColor}`}
          style={{
            width: notchSize,
            height: notchSize,
            borderRadius: notchSize / 2,
            marginLeft: -notchSize / 2,
            marginTop: -notchSize / 2,
            left: 0,
          }}
        />

        <Svg width="100%" height={2} className="ml-[18px]">
          <Line
            x1="0"
            y1="1"
            x2="100%"
            y2="1"
            stroke={dashColor}
            strokeWidth={1.5}
            strokeDasharray="16, 14"
          />
        </Svg>

        <View
          className={`absolute top-1/2 z-10 ${notchColor}`}
          style={{
            width: notchSize,
            height: notchSize,
            borderRadius: notchSize / 2,
            marginRight: -notchSize / 2,
            marginTop: -notchSize / 2,
            right: 0,
          }}
        />
      </View>

      {/* ---- Bottom section ---- */}
      <View className="px-[18px] pb-[18px] pt-[18px]">
        <Text className="font-saira text-[12px]" style={{ color: hexWithAlpha(fg, 0.75) }}>
          {stubLabel}
        </Text>
        <View className="pb-6">
          {!handling && (
            <Pressable
              className="mt-4 flex-row items-center justify-center gap-3 rounded-xl border border-white/50 bg-bg-1/10 px-4 py-3 pr-8"
              onPress={() => setHandling(true)}>
              <Ionicons name="ticket-outline" size={20} color={fg} />
              <Text className="text-center font-saira-semibold text-[14px]" style={{ color: fg }}>
                {buttonLabel}
              </Text>
            </Pressable>
          )}
          {handling && (
            <View className="flex-row items-center justify-between gap-3">
              {leftButtonLabel && (
                <Pressable
                  className="mt-4 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/50 bg-bg-1/10 px-4 py-3"
                  onPress={() => {
                    setHandling(false);
                    handleLeftButtonPress();
                  }}>
                  <Ionicons name="close-outline" size={20} color={'red'} />
                  <Text
                    className="text-center font-tektur-medium text-[14px]"
                    style={{ color: fg }}>
                    {leftButtonLabel}
                  </Text>
                </Pressable>
              )}
              {rightButtonLabel && (
                <Pressable
                  className="mt-4 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/50 bg-bg-1/10 px-4 py-3"
                  onPress={() => {
                    setHandling(false);
                    handleRightButtonPress();
                  }}>
                  <Ionicons name="checkmark-outline" size={20} color={'green'} />
                  <Text
                    className="text-center font-tektur-medium text-[14px]"
                    style={{ color: fg }}>
                    {rightButtonLabel}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {requirements.length > 0 && (
          <View className="mb-4">
            <Text
              className="mb-1 font-saira-bold text-[11px]"
              style={{ color: hexWithAlpha(fg, 0.6) }}>
              Requirements
            </Text>
            {requirements.map((line, i) => (
              <Text key={i} className="font-saira text-[13px] leading-[19px]" style={{ color: fg }}>
                {line}
              </Text>
            ))}
          </View>
        )}

        <Barcode value={barcodeValue} color={fg} height={30} />
        <Text
          className="mt-2 font-saira text-[12px] tracking-wide"
          style={{ color: hexWithAlpha(fg, 0.7) }}>
          {footerLabel}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Barcode                                                             */
/* ------------------------------------------------------------------ */

function Barcode({ value, color = '#111', height = 28 }) {
  return (
    <View className="flex-row items-center justify-center" style={{ height }}>
      <Text style={{ fontFamily: 'Barcode128', fontSize: 80, color }}>{value}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

function hexWithAlpha(hex, alpha) {
  const clean = hex?.replace('#', '');
  const bigint = parseInt(
    clean?.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getContrastText(hex) {
  const clean = hex?.replace('#', '');
  const bigint = parseInt(
    clean?.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#181818' : '#F7F5F0';
}
