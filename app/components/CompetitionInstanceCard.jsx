import { View, Text, Pressable, Animated, TouchableOpacity } from 'react-native';
import { useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

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
    case 'Full':
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

const getPlayerName = (player) => {
  if (!player) return 'A player';
  const fullName = [player.first_name, player.surname].filter(Boolean).join(' ');
  return fullName || player.nickname || 'A player';
};

export function checkEligibility(player, instance, currentRole) {
  if (!player || !instance || !currentRole)
    return { status: 'Ineligible', reasons: ['Missing required data'] };

  const activeParticipants =
    instance?.CompetitionParticipants?.filter(
      (p) => p.status !== 'left' && p.status !== 'cancelled'
    ) || [];

  const { dob, gender } = player;
  const division = instance.division_id;

  const participant =
    instance.competition.competitor_type === 'team'
      ? activeParticipants?.find((p) => p.team_id === currentRole?.team?.id)
      : activeParticipants?.find((p) => p.player_id === player.id);
  if (participant) {
    if (participant.status === 'requested') return { status: 'Requested', reasons: [] };
    if (participant.status === 'active') return { status: 'Entered', reasons: [] };
  }

  if (instance.entry_deadline) {
    const entryDeadline = new Date(instance.entry_deadline);
    if (!isNaN(entryDeadline) && new Date() > entryDeadline)
      return { status: 'Closed', reasons: ['The entry deadline for this competition has passed'] };
  }

  if (
    instance.max_competitors !== null &&
    instance.max_competitors !== undefined &&
    activeParticipants.length === instance.max_competitors
  ) {
    return {
      status: 'Full',
      reasons: ['This competition has reached its maximum number of competitors'],
    };
  }

  if (instance.competition.competitor_type === 'team') {
    if (instance.competition.team_type === 'child') {
      if (currentRole?.compTeams?.length === 0)
        return {
          status: 'Ineligible',
          reasons: ['You have no child teams available to enter this competition'],
        };

      const teamReasons = [];

      const teamIsEligible = currentRole?.compTeams?.some((team) => {
        // Get the active players for this comp team
        const players = team?.players?.filter((tp) => tp.status === 'active');
        if (!players?.length) {
          teamReasons.push(`${team?.name ?? 'A team'} has no active players`);
          return false;
        }
        if (instance.max_team_size && players.length > instance.max_team_size) {
          teamReasons.push(
            `${team?.name ?? 'A team'} exceeds the maximum team size of ${instance.max_team_size}`
          );
          return false;
        }
        if (division && division !== currentRole?.division?.id) {
          teamReasons.push('This competition is restricted to a different division');
          return false;
        }

        let teamPasses = true;

        players.forEach((tp) => {
          const name = getPlayerName(tp);

          if (!tp?.dob) {
            teamReasons.push(`${name} is missing a date of birth`);
            teamPasses = false;
            return;
          }

          const birth = new Date(tp.dob);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

          if (instance.min_age != null && age < instance.min_age) {
            teamReasons.push(
              `${name} (age ${age}) does not meet the minimum age requirement of ${instance.min_age}`
            );
            teamPasses = false;
          }
          if (instance.max_age != null && age > instance.max_age) {
            teamReasons.push(
              `${name} (age ${age}) exceeds the maximum age requirement of ${instance.max_age}`
            );
            teamPasses = false;
          }
          if (
            instance.gender &&
            instance.gender !== 'mixed' &&
            tp.gender &&
            instance.gender !== tp.gender
          ) {
            teamReasons.push(`${name} does not meet the gender requirement for this competition`);
            teamPasses = false;
          }
        });

        return teamPasses;
      });

      if (teamIsEligible) return { status: 'Eligible', reasons: [] };
      return { status: 'Ineligible', reasons: [...new Set(teamReasons)] };
    } else if (instance.competition.team_type === 'parent') {
      const divisionValid = instance.division_id
        ? instance.division_id === currentRole?.division?.id
          ? true
          : false
        : true;

      const teamIsEligible = divisionValid;

      if (teamIsEligible) return { status: 'Eligible', reasons: [] };
      return {
        status: 'Ineligible',
        reasons: ['This competition is restricted to a different division'],
      };
    }
  } else if (instance.competition.competitor_type === 'individual') {
    const reasons = [];

    if ((instance.min_age != null || instance.max_age != null) && !dob)
      return {
        status: 'Ineligible',
        reasons: ['Your date of birth is required to determine age eligibility'],
      };

    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (instance.min_age != null && age < instance.min_age)
      reasons.push(
        `You (age ${age}) do not meet the minimum age requirement of ${instance.min_age}`
      );
    if (instance.max_age != null && age > instance.max_age)
      reasons.push(`You (age ${age}) exceed the maximum age requirement of ${instance.max_age}`);
    if (instance.gender && instance.gender !== 'mixed' && gender && instance.gender !== gender)
      reasons.push('This competition is restricted to a different gender');
    if (division && currentRole?.division?.id !== division)
      reasons.push('This competition is restricted to a different division');

    if (reasons.length > 0) return { status: 'Ineligible', reasons };
    return { status: 'Eligible', reasons: [] };
  }
  return {
    status: 'Ineligible',
    reasons: ['Unable to determine eligibility for this competition'],
  };
}

export const formatCompetitionType = (value) => {
  if (!value) return '';
  return value
    .split('_')
    .map((word) => word.charAt(0)?.toUpperCase() + word.slice(1))
    .join(' & ');
};

const showEligibilityReasons = (eligibilityReasons) => {
  Toast.show({
    type: 'info',
    text1: 'Eligibility Reasons',
    text2: eligibilityReasons.join('\n'),
  });
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ label, colors, iconName, disabled, onPress }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress}>
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
      <Text style={{ fontFamily: 'Saira_500Medium', fontSize: 12, color: colors.text }}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
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
  const { status: eligibility, reasons: eligibilityReasons } = checkEligibility(
    player,
    instance,
    currentRole
  );
  const eligibilityColors = getStatusColors(eligibility);
  console.log('Eligibility:', eligibility, eligibilityReasons);

  const showEligibility =
    (instance.status === 'upcoming' || eligibility === 'Entered') && currentRole?.type !== 'admin';

  const activeCount = instance.CompetitionParticipants.filter((p) =>
    ['active', 'champion', 'runner_up', 'eliminated'].includes(p.status)
  ).length;
  const teamType = instance.competition.team_type === 'parent' ? 'League' : 'Competition';
  const competitorLabel =
    instance.competition.competitor_type.charAt(0).toUpperCase() +
    instance.competition.competitor_type.slice(1);

  const deadline = formatFixtureDate(instance?.entry_deadline);

  const statusLabel = instance.status.charAt(0).toUpperCase() + instance.status.slice(1);

  const eligibilityIcon = (() => {
    switch (eligibility) {
      case 'Ineligible':
      case 'Closed':
      case 'closed':
      case 'Full':
        return 'close-circle-outline';
      case 'Entered':
        return 'checkmark-circle-outline';
      case 'Requested':
        return 'time-outline';
      default:
        return 'checkmark-circle-outline';
    }
  })();

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
                {`${teamType} ${competitorLabel} · ${formatCompetitionType(instance.competition.competition_type)}`}
              </Text>
            </View>

            {/* Eligibility badge */}
            {showEligibility && (
              <StatusBadge
                label={eligibility}
                colors={eligibilityColors}
                iconName={eligibilityIcon}
                disabled={eligibility !== 'Ineligible'}
                onPress={() => {
                  if (eligibilityReasons.length > 0 && eligibility === 'Ineligible') {
                    showEligibilityReasons(eligibilityReasons);
                  }
                }}
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
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.05)',
          }}>
          {/* Left cluster */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              flex: 1,
            }}>
            <StatPill
              icon={<Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.45)" />}
              label={`${activeCount}${instance.max_competitors ? `/${instance.max_competitors}` : ''}`}
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
          <View style={{ flexShrink: 0, marginLeft: 8 }}>
            <StatPill
              icon={<Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.45)" />}
              label={deadline || 'No Deadline'}
            />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default CompetitionInstanceCard;
