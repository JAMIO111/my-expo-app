import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import TeamLogo from '@components/TeamLogo';
import { useRouter } from 'expo-router';
import { LeaderboardSkeleton } from '@components/Skeletons';

const LeaderboardCard = ({
  title,
  type = 'player',
  data = [],
  statKey = 'value',
  onPress,
  label,
  loading,
}) => {
  const router = useRouter();

  const getInitials = (firstName, surname) => {
    const firstInitial = firstName?.charAt(0).toUpperCase() || '';
    const surnameInitial = surname?.charAt(0).toUpperCase() || '';
    return firstInitial + surnameInitial;
  };

  const getValue =
    typeof statKey === 'function'
      ? statKey
      : (item) =>
          item?.[statKey] ?? // top-level stat
          item?.stats?.[statKey] ?? // nested inside `stats`
          0;

  console.log('Leaderboard Data:', data);

  const sortedData = [...data].sort((a, b) => getValue(b) - getValue(a));

  const getBgClass = (index) => {
    switch (index) {
      case 0:
        return 'bg-gold';
      case 1:
        return 'bg-silver';
      case 2:
        return 'bg-bronze';
      default:
        return 'bg-brand-light';
    }
  };

  const getTextClass = (index) => {
    switch (index) {
      case 0:
        return 'text-black';
      case 1:
        return 'text-black';
      case 2:
        return 'text-black';
      default:
        return 'text-white';
    }
  };

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <Pressable
      onPress={
        onPress ||
        (() =>
          router.push({
            pathname: '/rankings/podium',
            params: {
              data: JSON.stringify(sortedData),
              statKey,
              type,
              title,
              label,
            },
          }))
      }
      className="h-[300px] min-w-[300px] rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-3 pl-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <Text className="mb-2 pl-4 font-saira-semibold text-2xl text-text-1">{title}</Text>
      {sortedData.slice(0, 5).map((item, index) => (
        <View key={index} className="flex-row items-center justify-between p-2">
          <View className="min-w-0 flex-1 flex-row items-center">
            {/* Avatar or Team Crest */}
            {type === 'team' ? (
              <View className="px-2">
                <TeamLogo
                  size={35}
                  type={item?.crest?.type}
                  color1={item?.crest?.color1}
                  color2={item?.crest?.color2}
                  thickness={item?.crest?.thickness}
                />
              </View>
            ) : item?.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                className="mx-2 h-10 w-10 rounded-md border border-separator"
                resizeMode="cover"
              />
            ) : (
              <View className="mx-2 h-10 w-10 items-center justify-center rounded-md bg-brand-light">
                <Text className="pt-1 font-saira-medium text-xl text-white">
                  {getInitials(item.first_name, item.surname)}
                </Text>
              </View>
            )}

            {/* Name */}
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="font-saira-semibold text-lg text-text-1">
                {type === 'team' ? item.display_name : `${item.first_name} ${item.surname}`}
              </Text>
            </View>
          </View>

          {/* Stat Value */}
          <Text className="ml-3 font-saira-bold text-2xl text-text-1">{getValue(item)}</Text>
        </View>
      ))}
    </Pressable>
  );
};

export default LeaderboardCard;

const styles = StyleSheet.create({});
