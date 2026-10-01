import { useState } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ticket, X, Check, Scissors, Clock, Undo2 } from 'lucide-react-native';
import { shiftLightness } from '@lib/helperFunctions';
import { supabase } from '@/lib/supabase';
import { assertRpcOk } from '@lib/rpc';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';
import { Barcode, hexWithAlpha } from '@components/TicketCard';

const NOTCH = 22;

// Division requests and player team requests get their own colours so they're easy to tell apart.
const COLORS = {
  division_request: '#5B4B8A', // purple
  player_request: '#2C6E8F', // teal blue
  player_invite: '#2C6E8F',
};

const confirm = (title, message, confirmText, destructive) =>
  new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });

export default function AdminRequestTicket({ item }) {
  const queryClient = useQueryClient();
  const [handling, setHandling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fontsLoaded] = useFonts({
    Barcode128: require('../assets/fonts/LibreBarcode128-Regular.ttf'),
  });
  if (!fontsLoaded) return null;

  const type = item.ticket_type;
  const accentColor = COLORS[type] || '#354A52';
  const fg = '#F7F5F0';
  const dark = shiftLightness(accentColor, -6);
  const dash = hexWithAlpha(fg, 0.35);
  const name = item.requester_name || 'Unknown';

  let eyebrow;
  let eyebrowSub;
  let title;
  let subtitle;
  let footer;
  const when = item.requested_at ? new Date(item.requested_at).toLocaleDateString() : '';

  if (type === 'division_request') {
    eyebrow = 'Division Request';
    eyebrowSub = item.group_name || 'League';
    title = `${name} wants to join ${item.division_name}`;
    subtitle = item.team ? 'A team is asking to join this division.' : 'A player is asking to join this division.';
    footer = `Requested on ${when}`;
  } else if (type === 'player_invite') {
    eyebrow = 'Player Invite';
    eyebrowSub = item.team?.display_name;
    title = `${name} was invited to ${item.team?.display_name}`;
    subtitle = item.awaiting_admin
      ? item.awaiting_player
        ? 'Waiting on the player and league admin.'
        : 'Waiting on your approval.'
      : 'Waiting on the player to respond.';
    footer = `Invited on ${when}`;
  } else {
    eyebrow = 'Team Join Request';
    eyebrowSub = item.team?.display_name;
    title = `${name} wants to join ${item.team?.display_name}`;
    subtitle = item.awaiting_admin
      ? item.awaiting_captain
        ? 'Waiting on the team captain and league admin.'
        : 'Waiting on your approval.'
      : 'Waiting on the team captain.';
    footer = `Requested on ${when}`;
  }

  const hasAction = item.canApprove || item.canReject || item.canRevoke;

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['TeamPlayerRequests'] }),
      queryClient.invalidateQueries({ queryKey: ['DivisionJoinRequests'] }),
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests'] }),
      queryClient.invalidateQueries({ queryKey: ['TeamPlayers'] }),
      queryClient.invalidateQueries({ queryKey: ['Divisions'] }),
    ]);
  };

  const run = async (rpc, params, success) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc(rpc, params);
      assertRpcOk(data, error);
      await refresh();
      Toast.show({ type: 'success', text1: success.title, text2: success.message(data) });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.title || 'Action failed', text2: err.message });
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!(await confirm('Approve?', `Approve ${name}${type === 'division_request' ? ` into ${item.division_name}` : ` for ${item.team?.display_name}`}?`, 'Approve'))) return;
    if (type === 'division_request') {
      return run('handle_join_division_request', { p_request_id: item.id, p_action: 'approve' }, {
        title: 'Request approved',
        message: () => `${name} has been added to ${item.division_name}.`,
      });
    }
    return run(
      type === 'player_invite' ? 'accept_player_join_team_invite' : 'accept_player_join_team_request',
      { p_team_player_id: item.id },
      {
        title: 'Approval recorded',
        message: (d) =>
          d?.teamPlayer?.status && d.teamPlayer.status !== 'active'
            ? `${name} still needs approval from someone else.`
            : `${name} has joined ${item.team?.display_name}.`,
      }
    );
  };

  const reject = async () => {
    if (!(await confirm('Reject request?', `Reject ${name}'s request?`, 'Reject', true))) return;
    if (type === 'division_request') {
      return run('handle_join_division_request', { p_request_id: item.id, p_action: 'reject' }, {
        title: 'Request rejected',
        message: () => `${name}'s request was rejected.`,
      });
    }
    return run('decline_player_join_team_request', { p_team_player_id: item.id }, {
      title: 'Request rejected',
      message: () => `${name}'s request was rejected.`,
    });
  };

  const revoke = async () => {
    if (!(await confirm('Revoke invite?', `Withdraw the invite sent to ${name}?`, 'Revoke', true))) return;
    return run('revoke_player_join_team_invite', { p_team_player_id: item.id }, {
      title: 'Invite revoked',
      message: () => `The invite to ${name} was withdrawn.`,
    });
  };

  const actions = [
    item.canReject && { label: 'Reject', Icon: X, onPress: reject },
    item.canRevoke && { label: 'Revoke', Icon: Undo2, onPress: revoke },
    item.canApprove && { label: 'Approve', Icon: Check, onPress: approve },
  ].filter(Boolean);

  return (
    <View className="w-full overflow-hidden rounded-[18px] shadow-sm" style={{ backgroundColor: accentColor, height: 510 }}>
      <View style={{ backgroundColor: dark }} className="px-[18px] pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-saira-bold text-[14px] tracking-wide" style={{ color: hexWithAlpha(fg, 0.85) }}>
              {eyebrow}
            </Text>
            <Text className="font-saira-medium text-[12px]" style={{ color: hexWithAlpha(fg, 0.7) }} numberOfLines={1}>
              {eyebrowSub}
            </Text>
          </View>
          {item.team && type === 'division_request' ? (
            <TeamLogo size={40} {...item.team.crest} />
          ) : item.player ? (
            <Avatar player={item.player} size={40} borderRadius={8} />
          ) : (
            <Image source={require('../assets/BR-Logo-1024-No-Background.png')} style={{ width: 40, height: 40 }} />
          )}
        </View>
      </View>

      <View className="flex-1 justify-start px-4 py-4 pb-6">
        <Text className="flex-1 font-michroma" style={{ color: fg, fontSize: 22, lineHeight: 26 }}>
          {title}
        </Text>
        <Text className="mt-2 font-tektur text-xl" style={{ color: hexWithAlpha(fg, 0.75) }}>
          {subtitle}
        </Text>
      </View>

      <Scissors size={24} color="#FFFFFFBB" style={{ transform: [{ rotate: '180deg' }], position: 'absolute', bottom: 193, right: 20 }} />

      <View style={{ height: NOTCH }} className="justify-center">
        <View className="absolute top-1/2 z-10 bg-bg-2" style={{ width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, marginLeft: -NOTCH / 2, marginTop: -NOTCH / 2, left: 0 }} />
        <Svg width="100%" height={2} className="ml-[18px]">
          <Line x1="0" y1="1" x2="100%" y2="1" stroke={dash} strokeWidth={1.5} strokeDasharray="16, 14" />
        </Svg>
        <View className="absolute top-1/2 z-10 bg-bg-2" style={{ width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, marginRight: -NOTCH / 2, marginTop: -NOTCH / 2, right: 0 }} />
      </View>

      <View className="h-52 px-[18px] pb-[18px] pt-[14px]">
        <Text className="font-saira text-[12px]" style={{ color: hexWithAlpha(fg, 0.75) }}>
          {busy ? 'Working...' : hasAction ? 'Press the button below to handle the ticket.' : ''}
        </Text>

        <View className="pb-6">
          {!handling && (
            <Pressable
              disabled={!hasAction || busy}
              className={`mt-4 flex-row items-center justify-center gap-3 ${!hasAction || busy ? 'opacity-50' : ''} rounded-xl border border-white/50 bg-bg-1/10 px-4 py-3 pr-8`}
              onPress={() => {
                setHandling(true);
                setTimeout(() => setHandling(false), 4000);
              }}>
              {hasAction ? (
                <Ticket size={20} color={fg} style={{ transform: [{ rotate: '-45deg' }] }} />
              ) : (
                <Clock size={20} color={fg} />
              )}
              <Text className="text-center font-saira-semibold text-[14px]" style={{ color: fg }}>
                {hasAction ? 'Handle Request' : 'Waiting on others'}
              </Text>
            </Pressable>
          )}
          {handling && (
            <View className="flex-row items-center justify-between gap-3">
              {actions.map(({ label, Icon, onPress }) => (
                <Pressable
                  key={label}
                  className="mt-4 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/50 bg-bg-1/10 px-2 py-3"
                  onPress={() => {
                    setHandling(false);
                    onPress();
                  }}>
                  <Icon size={20} color="white" />
                  <Text className="text-center font-tektur-medium text-[14px]" style={{ color: fg }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Barcode value={String(item.id)} color={fg} height={30} />
        <Text className="mt-2 font-saira text-[12px] tracking-wide" style={{ color: hexWithAlpha(fg, 0.7) }}>
          {footer}
        </Text>
      </View>
    </View>
  );
}
