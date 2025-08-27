import { Text, View, Pressable, Animated } from 'react-native';
import { useRef } from 'react';
import TeamLogo from './TeamLogo';

const TeamInviteCard = ({ type, invite, onAccept, onDecline }) => {
  const declineScale = useRef(new Animated.Value(1)).current;
  const acceptScale = useRef(new Animated.Value(1)).current;

  const animatePress = (scaleRef, toValue) => {
    Animated.spring(scaleRef, {
      toValue,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="mb-6 w-full rounded-3xl border border-theme-teal bg-theme-teal/30 p-6">
      <View className="flex-row items-center justify-between gap-5">
        <View className="flex-1">
          <Text className="mb-3 font-saira-medium text-3xl text-text-1" style={{ lineHeight: 30 }}>
            {type === 'invite' ? 'Team Invite!' : 'Pending Request'}
          </Text>
          <Text style={{ lineHeight: 20 }} className="font-saira-regular text-lg text-text-1">
            {type === 'invite'
              ? `You have been invited to join ${invite?.team?.display_name} by ${invite?.requested_by_player?.first_name} ${invite?.requested_by_player?.surname}.`
              : `Your request to join ${invite?.team?.display_name} is pending approval.`}
          </Text>
        </View>
        <View className="items-center gap-3">
          <TeamLogo {...invite?.team?.crest} size={60} />
          <Text className="rounded-lg border border-theme-purple bg-theme-purple/50 px-2 font-saira-medium text-lg text-white">
            {invite?.team?.abbreviation}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-start gap-4">
        <Pressable
          onPressIn={() => animatePress(declineScale, 0.9)}
          onPressOut={() => animatePress(declineScale, 1)}
          onPress={onDecline}>
          <Animated.View
            style={{
              transform: [{ scale: declineScale }],
            }}
            className="items-center rounded-xl border border-theme-red bg-theme-red/70 p-2">
            <Text className="font-saira-medium text-lg text-white">
              {type === 'invite' ? 'Decline Invite' : 'Cancel Request'}
            </Text>
          </Animated.View>
        </Pressable>

        {type === 'invite' && (
          <Pressable
            onPressIn={() => animatePress(acceptScale, 0.9)}
            onPressOut={() => animatePress(acceptScale, 1)}
            onPress={onAccept}>
            <Animated.View
              style={{
                transform: [{ scale: acceptScale }],
              }}
              className="w-36 items-center rounded-xl border border-theme-green bg-theme-green/70 p-2">
              <Text className="font-saira-medium text-lg text-white">Accept Invite</Text>
            </Animated.View>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default TeamInviteCard;
