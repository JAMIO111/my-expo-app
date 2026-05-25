import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TeamLogo from './TeamLogo';

// Drop this in place of your existing header View
// Props: profile, line_1, line_2, city, postcode, TeamLogo component

const TeamProfileHeader = ({ profile }) => {
  const { line_1, line_2, city, postcode } = profile?.address || {};
  const address =
    [line_1, line_2, city, postcode].filter(Boolean).join(', ') || 'No Address Available';

  return (
    <View className="bg-brand" style={styles.container}>
      <View style={styles.inner}>
        {/* ── Left: crest + abbreviation ── */}
        <View style={styles.crestCol}>
          <View style={styles.crestRing}>
            <TeamLogo
              size={72}
              color1={profile?.crest?.color1}
              color2={profile?.crest?.color2}
              type={profile?.crest?.type}
              thickness={profile?.crest?.thickness}
            />
          </View>
          <View className="mt-2 flex-row items-center gap-2 rounded-lg bg-brand-light px-3 py-1">
            <Text style={styles.abbrevText}>{profile?.abbreviation}</Text>
          </View>
        </View>

        {/* ── Right: name, division, address ── */}
        <View style={styles.infoCol}>
          {/* Team name */}
          <Text className="font-saira-semibold text-3xl text-text-on-brand" numberOfLines={2}>
            {profile?.name || 'No Name'}
          </Text>

          {/* Division chip */}
          <View className="mt-2 flex-row items-center gap-2 rounded-lg bg-brand-light px-3 py-1">
            <View style={styles.divisionDot} />
            <Text style={styles.divisionText} numberOfLines={1}>
              {profile?.division?.district?.name
                ? `${profile.division.district.name} · ${profile?.division?.name ?? ''}`
                : (profile?.division?.name ?? 'No Division')}
            </Text>
          </View>

          {/* Address */}
          <View className="mt-6 flex-row items-center gap-2">
            <Ionicons name="location-sharp" size={14} color="#ffffff" />
            <Text className="font-saira text-text-on-brand" numberOfLines={2}>
              {address}
            </Text>
          </View>
        </View>
      </View>

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

export default TeamProfileHeader;

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

  // ── Crest ──
  crestCol: {
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },

  crestRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },

  abbrevPill: {
    backgroundColor: '#ff7777', //red
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  abbrevText: {
    fontFamily: 'Saira-SemiBold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 1.2,
  },

  // ── Info ──
  infoCol: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-start',
  },

  divisionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#ff7777', //red
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  divisionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },

  divisionText: {
    fontSize: 12,
    fontFamily: 'Saira-Medium',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  teamName: {
    fontFamily: 'Saira-Bold',
    fontSize: 26,
    color: '#0f172a',
    lineHeight: 30,
    letterSpacing: -0.3,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 22,
  },

  addressText: {
    flex: 1,
    fontFamily: 'Saira',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },

  bottomLine: {
    height: 1,
    width: '100%',
  },
});
