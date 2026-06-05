import React, { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '@components/Avatar';
import TeamLogo from '@components/TeamLogo';

// ─── Team Invite Card ─────────────────────────────────────────────────────────

export function TeamInviteCard({ invite, onAccept, onDecline, isAccepting, isDeclining }) {
  const scale = useRef(new Animated.Value(1)).current;
  const acceptScale = useRef(new Animated.Value(1)).current;
  const declineScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const pressIn = (anim) =>
    Animated.spring(anim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const pressOut = (anim) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  console.log('Rendering TeamInviteCard for invite:', invite);

  const teamName = invite?.team?.display_name ?? 'Unknown Team';
  const parentTeam = invite?.team?.parent_team ?? null;
  const invitedBy = invite?.invited_by_player ?? null;

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(253,204,77,0.15)',
        }}>
        {/* Header */}
        <LinearGradient
          colors={['#1a2a1a', '#111a11']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
          {/* Top row: invite badge + timestamp */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(253,204,77,0.1)',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: 'rgba(253,204,77,0.2)',
              }}>
              <Ionicons name="mail-open-outline" size={12} color="#FDCC4D" />
              <Text
                style={{
                  fontFamily: 'Saira_600SemiBold',
                  fontSize: 10,
                  color: '#FDCC4D',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}>
                Team Invitation
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'Saira_400Regular',
                fontSize: 12,
                color: 'rgba(255,255,255,0.25)',
              }}>
              {timeAgo(invite?.invited_at)}
            </Text>
          </View>

          {/* Team identity row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(253,204,77,0.15)',
              }}>
              <Ionicons name="shield-half" size={22} color="rgba(253,204,77,0.4)" />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Saira_700Bold',
                  fontSize: 18,
                  color: '#fff',
                  marginBottom: 3,
                }}
                numberOfLines={1}>
                {teamName}
              </Text>
              {parentTeam && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TeamLogo {...parentTeam?.crest} size={13} />
                  <Text
                    style={{
                      fontFamily: 'Saira_400Regular',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.35)',
                    }}>
                    {parentTeam.display_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* Invited by row */}
        {invitedBy && (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#0f160f',
              }}>
              <Avatar player={invitedBy} size={28} />
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  flex: 1,
                }}>
                Invited by{' '}
                <Text
                  style={{
                    fontFamily: 'Saira_600SemiBold',
                    color: 'rgba(255,255,255,0.75)',
                  }}>
                  {invitedBy.first_name} {invitedBy.surname}
                </Text>
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />
          </>
        )}

        {/* Accept / Decline */}
        <LinearGradient
          colors={['#0f160f', '#0c130c']}
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.04)',
          }}>
          {/* Decline */}
          <Animated.View style={{ flex: 1, transform: [{ scale: declineScale }] }}>
            <Pressable
              onPressIn={() => pressIn(declineScale)}
              onPressOut={() => pressOut(declineScale)}
              onPress={onDecline}
              disabled={isAccepting || isDeclining}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(248,113,113,0.2)',
                backgroundColor: 'rgba(248,113,113,0.08)',
                opacity: isDeclining ? 0.5 : 1,
              }}>
              <Ionicons name="close" size={16} color="#f87171" />
              <Text
                style={{
                  fontFamily: 'Saira_600SemiBold',
                  fontSize: 14,
                  color: '#f87171',
                }}>
                {isDeclining ? 'Declining…' : 'Decline'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Accept */}
          <Animated.View style={{ flex: 1, transform: [{ scale: acceptScale }] }}>
            <Pressable
              onPressIn={() => pressIn(acceptScale)}
              onPressOut={() => pressOut(acceptScale)}
              onPress={onAccept}
              disabled={isAccepting || isDeclining}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(74,222,128,0.25)',
                backgroundColor: 'rgba(74,222,128,0.1)',
                opacity: isAccepting ? 0.5 : 1,
              }}>
              <Ionicons name="checkmark" size={16} color="#4ade80" />
              <Text
                style={{
                  fontFamily: 'Saira_600SemiBold',
                  fontSize: 14,
                  color: '#4ade80',
                }}>
                {isAccepting ? 'Accepting…' : 'Accept'}
              </Text>
            </Pressable>
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default TeamInviteCard;
