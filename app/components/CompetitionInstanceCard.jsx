import { View, Text, Pressable } from 'react-native';
import { useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';

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
  if (maxAge) return `U${maxAge}`;
}

export function getStatusColors(status) {
  switch (status) {
    case 'Eligible':
      return { background: '#00800033', text: '#008000', border: '#00800066', accent: '#008000' };
    case 'Ineligible':
      return { background: '#FF000033', text: '#FF0000', border: '#FF000066', accent: '#FF0000' };
    case 'Closed':
    case 'closed':
      return { background: '#FF000033', text: '#FF0000', border: '#FF000066', accent: '#FF0000' };
    case 'Entered':
      return { background: '#00800033', text: '#008000', border: '#00800066', accent: '#008000' };
    case 'active':
      return { background: '#0000FF22', text: '#0000FF', border: '#0000FF66', accent: '#0000FF' };
    case 'upcoming':
      return { background: '#FFA50022', text: '#ff9100', border: '#ff910066', accent: '#ff9100' };
    case 'Requested':
      return { background: '#FFA50022', text: '#ff9100', border: '#ff910066', accent: '#ff9100' };
    case 'completed':
      return { background: '#80008033', text: '#800080', border: '#80008066', accent: '#800080' };
    default:
      return { background: '#00000033', text: '#000000', border: '#00000066', accent: '#000000' };
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

// ─── Gender icon helper ───────────────────────────────────────────────────────
const GenderIcon = ({ gender }) => {
  if (gender === 'male') return <Ionicons name="male" size={14} color="#0085E5" />;
  if (gender === 'female') return <Ionicons name="female" size={14} color="#FF69B4" />;
  return null;
};

// ─── Pill chip ────────────────────────────────────────────────────────────────
const Chip = ({ label, colors, icon }) => (
  <View
    style={{
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
    }}>
    {icon}
    <Text style={{ color: colors.text, fontFamily: 'Saira-Medium', fontSize: 13 }}>{label}</Text>
  </View>
);

// ─── Stat cell ────────────────────────────────────────────────────────────────
const StatCell = ({ icon, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    {icon}
    <Text style={{ fontFamily: 'Saira', fontSize: 14, color: '#888', marginTop: 1 }}>{label}</Text>
  </View>
);

// ─── Main card ────────────────────────────────────────────────────────────────
const CompetitionInstanceCard = ({ instance }) => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { player, currentRole } = useUser();

  const statusColors = getStatusColors(instance.status);
  const eligibility = checkEligibility(player, instance, currentRole);
  const eligibilityColors = getStatusColors(eligibility);

  const showEligibility =
    (instance.status === 'upcoming' || eligibility === 'Entered') && currentRole?.type !== 'admin';

  const activeCount = instance.CompetitionParticipants.filter(
    (p) =>
      p.status === 'active' ||
      p.status === 'champion' ||
      p.status === 'runner_up' ||
      p.status === 'eliminated'
  ).length;

  const competitorLabel =
    instance.competition.competitor_type.charAt(0).toUpperCase() +
    instance.competition.competitor_type.slice(1);

  const deadline = formatFixtureDate(instance?.entry_deadline);

  return (
    <Pressable
      onPress={() => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;
        setTimeout(() => {
          hasNavigated.current = false;
        }, 500);
        router.push(`/competitions/${instance.id}`);
      }}
      key={instance.id}
      className="overflow-hidden bg-bg-grouped-2 shadow-md"
      style={{
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
      }}>
      {/* ── Coloured status accent bar ── */}
      <View style={{ height: 8, backgroundColor: statusColors.accent, width: '100%' }} />

      <View className="p-4">
        {/* ── Header row: name + eligibility badge ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
          }}>
          <View style={{ flex: 1 }}>
            <Text className="font-saira-semibold text-2xl text-text-1" numberOfLines={2}>
              {instance.name}
            </Text>
            <Text className="font-saira text-base text-text-2" style={{ marginTop: 2 }}>
              {competitorLabel} · {formatCompetitionType(instance.competition.competition_type)}
            </Text>
          </View>

          {/* Eligibility badge — top-right, no longer absolutely positioned */}
          {showEligibility && (
            <View
              style={{
                backgroundColor: eligibilityColors.background,
                borderColor: eligibilityColors.border,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
                flexShrink: 0,
              }}>
              <Ionicons
                name={
                  eligibility === 'Ineligible' || eligibility === 'Closed'
                    ? 'close-circle-outline'
                    : 'checkmark-circle-outline'
                }
                size={14}
                color={eligibilityColors.text}
              />
              <Text
                style={{ color: eligibilityColors.text, fontFamily: 'Saira-Medium', fontSize: 13 }}>
                {eligibility}
              </Text>
            </View>
          )}
        </View>

        {/* ── Chips row: status + division ── */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Chip
            label={instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}
            colors={statusColors}
          />
          {instance.division && (
            <Chip
              label={instance.division.name}
              colors={{ background: '#8888880F', border: '#88888833', text: '#666' }}
            />
          )}
        </View>
      </View>

      {/* ── Footer stats row ── */}
      <View
        className="border-t border-theme-gray-4"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}>
        {/* Left cluster: participants, gender, age */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <StatCell
            icon={<Ionicons name="people-outline" size={16} color="#888" />}
            label={String(activeCount)}
          />
          {instance.gender === 'male' && <Ionicons name="male" size={16} color="#0085E5" />}
          {instance.gender === 'female' && <Ionicons name="female" size={16} color="#FF69B4" />}
          {(instance.max_age || instance.min_age) && (
            <StatCell
              icon={<MaterialCommunityIcons name="cake-variant-outline" size={16} color="#888" />}
              label={formatAgeRestrictions(instance?.min_age, instance?.max_age)}
            />
          )}
        </View>

        {/* Right: deadline */}
        <StatCell
          icon={<Ionicons name="calendar-outline" size={16} color="#888" />}
          label={deadline || 'No Deadline'}
        />
      </View>
    </Pressable>
  );
};

export default CompetitionInstanceCard;
