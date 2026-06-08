import React, { useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '@components/Avatar';
import TeamLogo from '@components/TeamLogo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Player Row ───────────────────────────────────────────────────────────────

function PlayerRow({ player, index, team, onPlayerPress }) {
  const isCaptain = team?.captain === player.id;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}>
      {/* Index */}
      <Text
        style={{
          fontFamily: 'Saira_400Regular',
          fontSize: 14,
          color: 'rgba(255,255,255,0.2)',
          width: 8,
          textAlign: 'center',
        }}>
        {index + 1}
      </Text>
      <View style={{ width: 10 }} />
      <Avatar player={player} size={30} />
      <View style={{ width: 10 }} />
      {/* Name + captain tag */}
      <View style={{ flex: 1, paddingRight: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View className="flex-1 flex-row items-center gap-2 overflow-hidden">
            <Text
              style={{
                fontFamily: isCaptain ? 'Saira_600SemiBold' : 'Saira_400Regular',
                fontSize: 14,
                color: isCaptain ? '#fff' : 'rgba(255,255,255,0.75)',
              }}>
              {player.first_name} {player.surname}
            </Text>
            <Text className="font-saira text-sm text-text-on-brand-2">
              {player?.nickname ? `(${player.nickname})` : ''}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {isCaptain && (
              <View
                style={{
                  backgroundColor: 'rgba(253, 204, 77, 0.15)',
                  borderRadius: 4,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}>
                <Text
                  style={{
                    fontFamily: 'Saira_600SemiBold',
                    fontSize: 9,
                    color: '#FDCC4D',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                  Captain
                </Text>
              </View>
            )}
            <View
              style={{
                backgroundColor:
                  player.status === 'active'
                    ? 'rgba(30, 250, 20, 0.15)'
                    : player.status === 'pending_player'
                      ? 'rgba(255, 0, 122, 0.15)' //pink
                      : 'transparent',
                borderRadius: 4,
                paddingHorizontal: 5,
                paddingVertical: 1,
              }}>
              <Text
                style={{
                  fontFamily: 'Saira_600SemiBold',
                  fontSize: 9,
                  color:
                    player.status === 'active'
                      ? 'rgba(30, 250, 20, 1)'
                      : player.status === 'pending_player'
                        ? 'rgba(255, 0, 122, 1)' //pink
                        : 'transparent',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}>
                {player.status === 'active'
                  ? 'Active'
                  : player.status === 'pending_player'
                    ? 'Invited'
                    : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Child Team Card ────────────────────────────────────────────────────────────────

export function ChildTeamCard({ team, onPress, onPlayerPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const players = team?.players ?? [];

  const sortedPlayers = players.sort((a, b) => {
    const getRank = (p) => {
      if (p.id === team?.captain) return 0;
      if (p.status === 'active') return 1;
      if (p.status === 'pending_player') return 2;
      return 3;
    };

    return getRank(a) - getRank(b);
  });

  const activePlayers = players?.filter((p) => p.status === 'active') ?? [];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.07)',
        }}>
        {/* Header gradient */}
        <LinearGradient
          colors={['#1a2a1a', '#111a11']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            {/* Team badge / fallback icon */}
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
              {team?.badge ? (
                <Image
                  source={{ uri: team.badge }}
                  style={{ width: 46, height: 46 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="shield-half" size={22} color="rgba(255,255,255,0.3)" />
              )}
            </View>

            {/* Name + player count */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Saira_700Bold',
                  fontSize: 18,
                  color: '#fff',
                  marginBottom: 2,
                }}
                numberOfLines={1}>
                {team?.display_name ?? 'Unnamed Team'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TeamLogo {...team?.parentTeam?.crest} size={14} />
                <Text className="font-saira text-text-on-brand-2">
                  {team?.parentTeam?.display_name ?? 'No parent team'}
                </Text>
                <Text className="text-xl text-text-on-brand-2"> · </Text>
                <Text
                  style={{
                    fontFamily: 'Saira_400Regular',
                    color: 'rgba(255,255,255,0.25)',
                  }}>
                  {activePlayers.length}{' '}
                  {activePlayers.length === 1 ? 'active player' : 'active players'}
                </Text>
              </View>
            </View>
            {onPress && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />}
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.06)',
              marginHorizontal: -16,
            }}
          />
        </LinearGradient>

        {/* Player list */}
        <View style={{ backgroundColor: '#0f160f' }}>
          {players.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.25)',
                }}>
                No players yet
              </Text>
            </View>
          ) : (
            sortedPlayers
              .filter((player) => player.status !== 'left')
              .map((player, index) => (
                <Pressable
                  key={player.id}
                  onPress={() => onPlayerPress?.(player)}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}>
                  <PlayerRow
                    player={player}
                    index={index}
                    team={team}
                    onPlayerPress={onPlayerPress}
                  />
                </Pressable>
              ))
          )}
        </View>

        {/* Footer */}
        <LinearGradient
          colors={['#0f160f', '#0c130c']}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.04)',
          }}>
          <Text
            style={{
              fontFamily: 'Saira_400Regular',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
            Team Status
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 6,
              borderRadius: 6,
              backgroundColor:
                team?.status === 'active'
                  ? 'rgba(30, 250, 20, 0.15)'
                  : team?.status === 'pending'
                    ? 'rgba(255, 165, 0, 0.15)'
                    : team?.status === 'inactive'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.1)',
            }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor:
                  team?.status === 'active'
                    ? 'rgba(30, 250, 20, 1)'
                    : team?.status === 'pending'
                      ? 'rgba(255,165,0,1)'
                      : team?.status === 'inactive'
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(255,255,255,0.5)',
              }}
            />
            <Text
              style={{
                fontFamily: 'Saira_500Medium',
                fontSize: 12,
                color:
                  team?.status === 'active'
                    ? 'rgba(30, 250, 20, 1)'
                    : team?.status === 'pending'
                      ? 'rgba(255,165,0,1)' //orange
                      : team?.status === 'inactive'
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(255,255,255,0.5)',
              }}>
              {team?.status === 'active'
                ? 'ACTIVE'
                : team?.status === 'pending'
                  ? 'PENDING'
                  : team?.status === 'inactive'
                    ? 'INACTIVE'
                    : 'UNKNOWN'}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default ChildTeamCard;
