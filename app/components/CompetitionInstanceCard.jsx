import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';

export function formatFixtureDate(date) {
  if (!date) return '';

  const inputDate = new Date(date);
  const now = new Date();

  // Reset time for accurate day diff (no half-day nonsense)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfInput = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

  const diffMs = startOfInput - startOfToday;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Less than a week → return days remaining
  if (diffDays >= 0 && diffDays < 7) {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  }

  // Otherwise → formatted date
  return inputDate.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatAgeRestrictions(minAge, maxAge) {
  if (!minAge && !maxAge) return '';
  if (minAge && maxAge) return `${minAge}-${maxAge}`;
  if (minAge) return `Over ${minAge}s`;
  if (maxAge) return `Under ${maxAge}s`;
}

export function getStatusColors(status) {
  switch (status) {
    case 'Eligible':
      return { background: '#00800033', text: '#008000', border: '#00800066' }; // Green
    case 'Ineligible':
      return { background: '#FF000033', text: '#FF0000', border: '#FF000066' }; // Red
    case 'Closed':
      return { background: '#FF000033', text: '#FF0000', border: '#FF000066' }; // Red
    case 'Entered':
      return { background: '#00800033', text: '#008000', border: '#00800066' }; // Green
    case 'active':
      return { background: '#0000FF22', text: '#0000FF', border: '#0000FF66' }; // Blue
    case 'upcoming':
      return { background: '#FFA50022', text: '#ff9100', border: '#ff910066' }; // Orange
    case 'Requested':
      return { background: '#FFA50022', text: '#ff9100', border: '#ff910066' }; // Orange
    case 'completed':
      return { background: '#80008033', text: '#800080', border: '#80008066' }; // Purple
    default:
      return { background: '#00000033', text: '#000000', border: '#00000066' }; // Default to black
  }
}

export function checkEligibility(player, instance, currentRole) {
  const validParticipants = instance.CompetitionParticipants.filter(
    (p) => p.status !== 'left' && p.status !== 'cancelled'
  );

  if (!player || !instance) return 'Ineligible';

  const { dob, gender } = player;
  const division = instance.division_id;

  // Already entered
  const participant =
    instance.competition.competitor_type === 'team'
      ? validParticipants?.find((p) => p.team_id === currentRole?.team?.id)
      : validParticipants?.find((p) => p.player_id === player.id);

  if (participant) {
    if (participant.status === 'requested') return 'Requested';
    if (participant.status === 'active') return 'Entered';
  }

  // Division check
  if (division && currentRole?.division?.id !== division) {
    return 'Ineligible';
  }

  // Missing DOB
  if (!dob) return 'Ineligible';

  // Gender check
  if (instance.gender && instance.gender !== 'mixed' && gender && instance.gender !== gender) {
    return 'Ineligible';
  }

  // Age calculation
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  if (instance.min_age != null && age < instance.min_age) return 'Ineligible';
  if (instance.max_age != null && age > instance.max_age) return 'Ineligible';

  // Entry deadline
  if (instance.entry_deadline) {
    const entryDeadline = new Date(instance.entry_deadline);
    if (!isNaN(entryDeadline) && new Date() > entryDeadline) {
      return 'Closed';
    }
  }

  return 'Eligible';
}

export const formatCompetitionType = (value) => {
  if (!value) return '';

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ');
};

const CompetitionInstanceCard = ({ instance }) => {
  const router = useRouter();
  const statusColors = getStatusColors(instance.status);
  const { player, currentRole } = useUser();
  const eligibility = checkEligibility(player, instance, currentRole);
  const eligibilityColors = getStatusColors(eligibility);
  const divisionColors = getStatusColors(instance?.division?.name); // Use 'active' colors for divisions, or default if no division
  return (
    <Pressable
      onPress={() => {
        router.push(`/competitions/${instance.id}`);
      }}
      key={instance.id}
      className="relative rounded-2xl bg-bg-1 shadow-md">
      <View className="p-4">
        <Text className="font-saira-medium text-2xl text-text-1">{instance.name}</Text>
        <Text className="font-saira text-lg text-text-2">
          {`${instance.competition.competitor_type.slice(0, 1).toUpperCase() + instance.competition.competitor_type.slice(1)} ${formatCompetitionType(instance.competition.competition_type)} Format`}
        </Text>
        <View className="mt-3 flex-row items-center justify-start gap-3">
          <View
            style={{
              backgroundColor: statusColors.background,
              borderColor: statusColors.border,
              borderWidth: 1,
            }}
            className="w-fit flex-row items-center justify-center rounded-xl px-3 py-1">
            <Text
              style={{ color: statusColors.text }}
              className="text-md text-center font-saira-medium">
              {instance.status.slice(0, 1).toUpperCase() + instance.status.slice(1)}
            </Text>
          </View>

          {instance.division && (
            <View
              style={{
                backgroundColor: divisionColors.background,
                borderColor: divisionColors.border,
                borderWidth: 1,
              }}
              className="w-fit flex-row items-center justify-center rounded-xl px-3 py-1">
              <Text
                style={{ color: divisionColors.text }}
                className="text-md text-center font-saira-medium">
                {instance.division?.name}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View className="flex flex-row items-center justify-between border-t border-theme-gray-4 px-4 py-2">
        <View className="flex-row items-center justify-center gap-3">
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="people-outline" size={20} color="#666" />
            <Text className="mt-1 font-saira text-xl text-text-2">
              {instance.CompetitionParticipants.filter((p) => p.status === 'active').length}
            </Text>
          </View>
          {instance.gender === 'male' && <Ionicons name="male" size={20} color="#0085E5" />}
          {instance.gender === 'female' && <Ionicons name="female" size={20} color="#FF69B4" />}
          {(instance.max_age || instance.min_age) && (
            <View className="flex-row items-center justify-center gap-1">
              <MaterialCommunityIcons name="cake-variant-outline" size={20} color="#777" />
              <Text className="mt-2 font-saira text-xl text-text-2">
                {formatAgeRestrictions(instance?.min_age, instance?.max_age)}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center justify-center gap-2">
          <Ionicons name="calendar-outline" size={20} color={'#666'} />
          <Text className={'mt-1 font-saira text-xl text-text-2'}>
            {formatFixtureDate(instance?.entry_deadline)}
          </Text>
        </View>
      </View>
      {(instance.status === 'upcoming' || eligibility === 'Entered') &&
        currentRole?.role !== 'admin' && (
          <View
            style={{
              backgroundColor: eligibilityColors.background,
              borderColor: eligibilityColors.border,
              borderWidth: 1,
            }}
            className="absolute right-3 top-3 w-fit flex-row items-center justify-center gap-1 rounded-xl px-3 py-1">
            <Ionicons
              name={
                eligibility === 'Ineligible' || eligibility === 'Closed'
                  ? 'close-circle-outline'
                  : 'checkmark-circle-outline'
              }
              size={16}
              color={eligibilityColors.text}
            />
            <Text
              style={{ color: eligibilityColors.text }}
              className="text-md text-center font-saira-medium">
              {eligibility}
            </Text>
          </View>
        )}
    </Pressable>
  );
};

export default CompetitionInstanceCard;
