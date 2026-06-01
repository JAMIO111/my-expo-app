import { View, Text, Pressable, Animated } from 'react-native';
import { useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';

// ─── Helpers (unchanged) ──────────────────────────────────────────────────────

export function formatFixtureDate(date) {
  if (!date) return '';
  const inputDate = new Date(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  const diffMs = startOfInput - startOfToday;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  }
  return inputDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

export function formatAgeRestrictions(minAge, maxAge) {
  if (!minAge && !maxAge) return '';
  if (minAge && maxAge) return `${minAge}–${maxAge}`;
  if (minAge) return `${minAge}+`;
  if (maxAge) return `Under ${maxAge}`;
}

export function getStatusColors(status) {
  switch (status) {
    case 'Eligible':
      return { background: '#00800033', text: '#4ade80', border: '#4ade8044', accent: '#4ade80' };
    case 'Ineligible':
      return { background: '#FF000022', text: '#f87171', border: '#f8717144', accent: '#f87171' };
    case 'Closed':
    case 'closed':
      return { background: '#FF000022', text: '#f87171', border: '#f8717144', accent: '#f87171' };
    case 'Entered':
      return { background: '#00800033', text: '#4ade80', border: '#4ade8044', accent: '#4ade80' };
    case 'active':
      return { background: '#3b82f622', text: '#60a5fa', border: '#60a5fa44', accent: '#60a5fa' };
    case 'upcoming':
      return { background: '#f9731622', text: '#fb923c', border: '#fb923c44', accent: '#fb923c' };
    case 'Requested':
      return { background: '#f9731622', text: '#fb923c', border: '#fb923c44', accent: '#fb923c' };
    case 'completed':
      return { background: '#a855f722', text: '#c084fc', border: '#c084fc44', accent: '#c084fc' };
    default:
      return {
        background: '#ffffff11',
        text: 'rgba(255,255,255,0.4)',
        border: '#ffffff22',
        accent: 'rgba(255,255,255,0.2)',
      };
  }
}

export function checkEligibility(player, instance, currentRole) {
  const validParticipants = instance.CompetitionParticipants.filter(
    (p) => p.status !== 'left' && p.status !== 'cancelled'
  );
  if (!player || !instance) return 'Ineligible';
  const { dob, gender } = player;
  const division = instance.division_id;
  const participant =
    instance.competition.competitor_type === 'team'
      ? validParticipants?.find((p) => p.team_id === currentRole?.team?.id)
      : validParticipants?.find((p) => p.player_id === player.id);
  if (participant) {
    if (participant.status === 'requested') return 'Requested';
    if (participant.status === 'active') return 'Entered';
  }
  if (division && currentRole?.division?.id !== division) return 'Ineligible';
  if (!dob) return 'Ineligible';
  if (instance.gender && instance.gender !== 'mixed' && gender && instance.gender !== gender)
    return 'Ineligible';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (instance.min_age != null && age < instance.min_age) return 'Ineligible';
  if (instance.max_age != null && age > instance.max_age) return 'Ineligible';
  if (instance.entry_deadline) {
    const entryDeadline = new Date(instance.entry_deadline);
    if (!isNaN(entryDeadline) && new Date() > entryDeadline) return 'Closed';
  }
  return 'Eligible';
}

export const formatCompetitionType = (value) => {
  if (!value) return '';
  return value
    .split('_')
    .map((word) => word.charAt(0)?.toUpperCase() + word.slice(1))
    .join(' & ');
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ label, colors, iconName }) => (
  <View
    style={{
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    }}>
    {iconName && <Ionicons name={iconName} size={13} color={colors.text} />}
    <Text style={{ fontFamily: 'Saira_500Medium', fontSize: 12, color: colors.text }}>{label}</Text>
  </View>
);

// ─── Footer stat pill ─────────────────────────────────────────────────────────

const StatPill = ({ icon, label }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    }}>
    {icon}
    <Text style={{ fontFamily: 'Saira_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
      {label}
    </Text>
  </View>
);

// ─── Main card ────────────────────────────────────────────────────────────────

const CompetitionInstanceCard = ({ instance }) => {
  const hasNavigated = useRef(false);
  const scale = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const { player, currentRole } = useUser();

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const statusColors = getStatusColors(instance.status);
  const eligibility = checkEligibility(player, instance, currentRole);
  const eligibilityColors = getStatusColors(eligibility);

  const showEligibility =
    (instance.status === 'upcoming' || eligibility === 'Entered') && currentRole?.type !== 'admin';

  const activeCount = instance.CompetitionParticipants.filter((p) =>
    ['active', 'champion', 'runner_up', 'eliminated'].includes(p.status)
  ).length;

  const competitorLabel =
    instance.competition.competitor_type.charAt(0).toUpperCase() +
    instance.competition.competitor_type.slice(1);

  const deadline = formatFixtureDate(instance?.entry_deadline);

  const statusLabel = instance.status.charAt(0).toUpperCase() + instance.status.slice(1);

  const eligibilityIcon =
    eligibility === 'Ineligible' || eligibility === 'Closed'
      ? 'close-circle-outline'
      : eligibility === 'Entered'
        ? 'checkmark-circle-outline'
        : eligibility === 'Requested'
          ? 'time-outline'
          : 'checkmark-circle-outline';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          if (hasNavigated.current) return;
          hasNavigated.current = true;
          setTimeout(() => {
            hasNavigated.current = false;
          }, 500);
          router.push(`/competitions/${instance.id}`);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.07)',
        }}>
        {/* ── Top accent bar (status colour) ── */}
        <View style={{ height: 8, backgroundColor: statusColors.accent, width: '100%' }} />

        {/* ── Header gradient ── */}
        <LinearGradient
          colors={['#1a2a1a', '#111a11']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
          {/* Name row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
            }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Saira_700Bold',
                  fontSize: 20,
                  color: '#fff',
                  marginBottom: 3,
                }}
                numberOfLines={2}>
                {instance.name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 0.3,
                }}>
                {competitorLabel} · {formatCompetitionType(instance.competition.competition_type)}
              </Text>
            </View>

            {/* Eligibility badge */}
            {showEligibility && (
              <StatusBadge
                label={eligibility}
                colors={eligibilityColors}
                iconName={eligibilityIcon}
              />
            )}
          </View>

          {/* Status + division chips */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge label={statusLabel} colors={statusColors} />
            {instance.division && (
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                <Text
                  style={{
                    fontFamily: 'Saira_500Medium',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                  {instance.division.name}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Footer stats row ── */}
        <LinearGradient
          colors={['#0f160f', '#0c130c']}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.05)',
          }}>
          {/* Left cluster */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StatPill
              icon={<Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.45)" />}
              label={String(activeCount)}
            />
            {(instance.max_age || instance.min_age) && (
              <StatPill
                icon={
                  <MaterialCommunityIcons
                    name="cake-variant-outline"
                    size={14}
                    color="rgba(255,255,255,0.45)"
                  />
                }
                label={formatAgeRestrictions(instance?.min_age, instance?.max_age)}
              />
            )}
            {instance.gender === 'male' && (
              <StatPill icon={<Ionicons name="male" size={14} color="#60a5fa" />} label="Male" />
            )}
            {instance.gender === 'female' && (
              <StatPill
                icon={<Ionicons name="female" size={14} color="#f9a8d4" />}
                label="Female"
              />
            )}
          </View>

          {/* Right: deadline */}
          <StatPill
            icon={<Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.45)" />}
            label={deadline || 'No Deadline'}
          />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default CompetitionInstanceCard;
