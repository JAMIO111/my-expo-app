import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const positionLabel = (result) => {
  if (result === '1') return { label: 'Winners', icon: 'trophy', color: '#F5C842' };
  if (result === '2') return { label: 'Runners Up', icon: 'medal', color: '#C0C0C0' };
  return { label: 'Participant', icon: 'ribbon', color: '#CD7F32' };
};

// ─── Stat row ─────────────────────────────────────────────────────────────────
const StatRow = ({ label, value, accent }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, accent && { color: accent }]}>{value}</Text>
  </View>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => <View style={styles.divider} />;

// ─── Main component ───────────────────────────────────────────────────────────
// Drop this as the content inside your modal — no overlay/close button needed
// since those live in the parent modal component.
// Props: selectedTrophy

const TrophyModalContent = ({ selectedTrophy }) => {
  const position = positionLabel(selectedTrophy?.result);

  const formatCompetitionType = (value) => {
    return value.replace(/-/g, ' & ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <ScrollView style={styles.container}>
      {/* ── Hero section ──────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Dark radial glow behind trophy */}
        <LinearGradient
          colors={['#2a1f00', '#1a1208', '#0d0d0d']}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle gold shimmer ring */}
        <View style={styles.glowRing} />

        {selectedTrophy?.image && (
          <Image source={selectedTrophy.image} style={styles.trophyImage} resizeMode="contain" />
        )}

        {/* Position badge pinned bottom-centre of hero */}
        <View style={[styles.positionBadge, { borderColor: position.color + '55' }]}>
          <LinearGradient
            colors={[position.color + '33', position.color + '11']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name={position.icon} size={14} color={position.color} />
          <Text style={[styles.positionText, { color: position.color }]}>{position.label}</Text>
        </View>
      </View>

      {/* ── Title block ───────────────────────────────────────────────────── */}
      <View style={styles.titleBlock}>
        <Text style={styles.seasonName} numberOfLines={2}>
          {selectedTrophy?.season_name || 'Season'}
        </Text>
        <Text style={styles.competitionName} numberOfLines={1}>
          {selectedTrophy?.competition_instance_name || 'Competition'}
        </Text>
      </View>

      {/* ── Stats panel ───────────────────────────────────────────────────── */}
      <View style={styles.statsPanel}>
        <StatRow label="District" value={selectedTrophy?.district_name || 'N/A'} />
        <Divider />
        <StatRow
          label="Competition Type"
          value={formatCompetitionType(selectedTrophy?.competition_type || 'N/A')}
        />
        <Divider />
        <StatRow
          label="Competitor Type"
          value={formatCompetitionType(selectedTrophy?.competitor_type || 'N/A')}
        />
        <Divider />
        {selectedTrophy?.division_name && selectedTrophy?.competition_type === 'league' && (
          <>
            <StatRow label="Division" value={selectedTrophy?.division_name || 'N/A'} />
            <Divider />
          </>
        )}
        <StatRow label="Position" value={position.label} accent={position.color} />
        <Divider />
        <StatRow label="Awarded at" value={fmt(selectedTrophy?.created_at)} />
        <Divider />
        <StatRow label="Season Start" value={fmt(selectedTrophy?.season_start)} />
        <Divider />
        <StatRow
          label="Season End"
          value={selectedTrophy?.season_end ? fmt(selectedTrophy?.season_end) : 'Ongoing'}
        />
      </View>
    </ScrollView>
  );
};

export default TrophyModalContent;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#0d0d0d',
    flex: 1,
  },

  // ── Hero ──
  hero: {
    height: 300,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 40,
    borderColor: '#F5C84208',
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 10,
  },

  trophyImage: {
    width: 160,
    height: 200,
    zIndex: 1,
  },

  positionBadge: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    overflow: 'hidden',
  },

  positionText: {
    fontFamily: 'Saira-SemiBold',
    fontSize: 13,
    letterSpacing: 0.8,
  },

  // ── Title ──
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0f',
  },

  seasonName: {
    fontFamily: 'Saira-SemiBold',
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: -0.3,
    lineHeight: 28,
  },

  competitionName: {
    fontFamily: 'Saira',
    fontSize: 18,
    color: '#888',
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // ── Stats ──
  statsPanel: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  statLabel: {
    fontFamily: 'Saira',
    fontSize: 13,
    color: '#666',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  statValue: {
    fontFamily: 'Saira-SemiBold',
    fontSize: 15,
    color: '#e5e5e5',
    letterSpacing: 0.1,
  },

  divider: {
    height: 1,
    backgroundColor: '#ffffff0a',
  },
});
