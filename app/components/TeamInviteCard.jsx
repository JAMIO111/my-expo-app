import { Text, View, Pressable, Animated } from 'react-native';
import { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TeamLogo from './TeamLogo';

const TeamInviteCard = ({ type, invite, onAccept, onDecline }) => {
  const declineScale = useRef(new Animated.Value(1)).current;
  const acceptScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  const isInvite = type === 'invite';

  const animatePress = (scaleRef, toValue) => {
    Animated.spring(scaleRef, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: cardScale }] }}
      className="mb-6 w-full overflow-hidden rounded-3xl bg-bg-grouped-2 shadow-sm">
      {/* Top accent strip */}
      <LinearGradient
        colors={isInvite ? ['#D4AF37', '#d4922a'] : ['#4b5563', '#374151']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 4 }}
      />

      <View className="p-5">
        {/* Status pill */}
        <View className="mb-4 flex-row items-center justify-between">
          <View
            className="flex-row items-center gap-2 self-start rounded-full px-3 py-1"
            style={{
              backgroundColor: isInvite ? 'rgba(212,175,55,0.15)' : 'rgba(107,114,128,0.15)',
            }}>
            <Ionicons
              name={isInvite ? 'sparkles' : 'hourglass-outline'}
              size={14}
              color={isInvite ? '#D4AF37' : '#9ca3af'}
            />
            <Text
              className="font-saira-semibold text-xs uppercase tracking-wide"
              style={{ color: isInvite ? '#D4AF37' : '#9ca3af' }}>
              {isInvite ? 'New Invite' : 'Pending'}
            </Text>
          </View>

          <View className="rounded-lg border px-2 py-0.5" style={{ borderColor: '#D4AF37' }}>
            <Text className="text-theme-gold font-saira-medium text-sm">
              {invite?.team?.abbreviation}
            </Text>
          </View>
        </View>

        {/* Team identity */}
        <View className="flex-row items-center gap-4">
          <View
            className="items-center justify-center rounded-2xl p-1"
            style={{ borderWidth: 2, borderColor: isInvite ? '#D4AF37' : '#374151' }}>
            <TeamLogo {...invite?.team?.crest} size={48} />
          </View>
          <View className="flex-1">
            <Text className="font-saira-semibold text-2xl text-text-1" style={{ lineHeight: 28 }}>
              {invite?.team?.display_name}
            </Text>
            <Text
              className="mt-1 font-saira-regular text-sm text-text-2"
              style={{ lineHeight: 18 }}>
              {isInvite
                ? `Invited by ${invite?.requested_by_player?.first_name} ${invite?.requested_by_player?.surname}`
                : 'Waiting on captain approval'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="mt-5 flex-row gap-3">
          <Pressable
            className="flex-1"
            onPressIn={() => animatePress(declineScale, 0.95)}
            onPressOut={() => animatePress(declineScale, 1)}
            onPress={onDecline}>
            <Animated.View
              style={{ transform: [{ scale: declineScale }] }}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-theme-red/50 bg-theme-red/10 py-3">
              <Ionicons name="close-outline" size={18} color="#ef4444" />
              <Text className="font-saira-medium text-base text-theme-red">
                {isInvite ? 'Decline' : 'Cancel'}
              </Text>
            </Animated.View>
          </Pressable>

          {isInvite && (
            <Pressable
              className="flex-1"
              onPressIn={() => animatePress(acceptScale, 0.95)}
              onPressOut={() => animatePress(acceptScale, 1)}
              onPress={onAccept}>
              <Animated.View style={{ transform: [{ scale: acceptScale }] }}>
                <LinearGradient
                  colors={['#D4AF37', '#d4922a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12 }}
                  className="flex-row items-center justify-center gap-2 py-3">
                  <Ionicons name="checkmark-outline" size={18} color="#080c08" />
                  <Text className="font-saira-semibold text-base text-brand">Accept</Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default TeamInviteCard;
