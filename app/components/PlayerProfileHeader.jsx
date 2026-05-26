import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CachedImage from './CachedImage';
import { getAgeInYearsAndDays, isBirthdayToday } from '@lib/helperFunctions';
import { useUser } from '@contexts/UserProvider';
import Heading from './Heading';
import Avatar from './Avatar';

// Drop this in place of your existing player header View
// Props: playerProfile, currentTeam, years, days, isBirthdayToday

const PlayerProfileHeader = ({ playerProfile, currentTeam }) => {
  const fullName =
    [playerProfile?.first_name, playerProfile?.surname].filter(Boolean).join(' ') || 'No Name';

  const initials = [playerProfile?.first_name?.charAt(0), playerProfile?.surname?.charAt(0)]
    .filter(Boolean)
    .join('');

  const sinceDate = playerProfile?.created_at
    ? new Date(playerProfile.created_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const dob = playerProfile?.dob
    ? new Date(playerProfile.dob).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '';

  const { years, days } = getAgeInYearsAndDays(playerProfile?.dob);

  const ageLabel = playerProfile?.dob
    ? `${years}y ${days}d${isBirthdayToday(playerProfile?.dob) ? ' 🎂' : ''}`
    : '';

  return (
    <View className="bg-brand" style={styles.container}>
      <View style={styles.inner}>
        {/* ── Left: avatar + nickname pill ── */}
        <View style={styles.avatarCol}>
          <View style={styles.avatarRing}>
            <Avatar size={120} player={playerProfile} borderRadius={12} />
          </View>
        </View>

        {/* ── Right: name, team chip, details ── */}
        <View style={styles.infoCol}>
          {/* Player name */}
          <Text style={styles.nicknameText} numberOfLines={1}>
            {playerProfile?.nickname?.toUpperCase() ||
              playerProfile?.surname?.toUpperCase() ||
              'No Nickname'}
          </Text>

          {/* Team chip — mirrors division chip in TeamProfileHeader */}
          {currentTeam?.team_name && (
            <View className="flex-row items-center gap-2 rounded-lg bg-brand-light px-3 py-1">
              <View style={styles.teamDot} />
              <Text style={styles.teamText} numberOfLines={1}>
                {currentTeam.team_name}
              </Text>
            </View>
          )}

          {/* DOB & age row — mirrors address row in TeamProfileHeader */}
          <View className="mt-2 flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={14} color="#ffffff" />
            <Text className="font-saira text-text-on-brand" numberOfLines={1}>
              {dob ? `${dob} · ${ageLabel}` : 'No DOB'}
            </Text>
          </View>

          {/* Member since row */}
          <View className="mt-1 flex-row items-center gap-2">
            <Image
              source={require('@assets/Break-Room-Logo-1024-Background.png')}
              style={{ width: 15, height: 15 }}
            />
            <Text className="font-saira text-text-on-brand" numberOfLines={1}>
              Since {sinceDate || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Decorative footer strip — identical to TeamProfileHeader ── */}
      <View>
        <View className="h-4 w-full bg-brand-light" />
        <View className="h-6 flex-row items-center justify-around bg-red-950">
          {[...Array(4)].map((_, i) => (
            <View key={i} className="h-1.5 w-1.5 rounded-full bg-theme-gray-3" />
          ))}
        </View>
      </View>

      {/* Bottom separator with fade */}
      <LinearGradient
        colors={['transparent', '#e5e7eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomLine}
      />
    </View>
  );
};

export default PlayerProfileHeader;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },

  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 24,
  },

  // ── Avatar ──
  avatarCol: {
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },

  avatarRing: {
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },

  initialsCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    // bg-brand-light equivalent — adjust to your token value
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  initialsText: {
    fontFamily: 'Michroma',
    fontSize: 24,
    color: '#ffffff',
  },

  nicknameText: {
    fontFamily: 'Saira-medium',
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 1.2,
  },

  // ── Info ──
  infoCol: {
    flex: 1,
    gap: 5,
    alignItems: 'flex-start',
  },

  teamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },

  teamText: {
    fontSize: 12,
    fontFamily: 'Saira-Medium',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  bottomLine: {
    height: 1,
    width: '100%',
  },
});
