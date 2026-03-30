import { View, Text } from 'react-native';
import Avatar from '@components/Avatar';
import TeamLogo from '@components/TeamLogo';

const getRankStyle = (index) => {
  if (index === 0) return { bg: 'bg-amber-400', text: 'text-amber-900' };
  if (index === 1) return { bg: 'bg-zinc-300', text: 'text-zinc-700' };
  if (index === 2) return { bg: 'bg-amber-700', text: 'text-amber-100' };
  return { bg: 'bg-zinc-800', text: 'text-zinc-400' };
};

export const LeaderboardRow = ({ item, index, type, getValue, label }) => {
  const rank = getRankStyle(index);
  const isTop3 = index < 3;

  return (
    <View
      className={`mb-2 w-full flex-row items-center overflow-hidden rounded-2xl
        ${isTop3 ? 'border border-zinc-700 bg-zinc-900' : 'border border-zinc-800 bg-zinc-950'}`}
      style={{
        shadowColor: index === 0 ? '#f59e0b' : '#000',
        shadowOpacity: index === 0 ? 0.25 : 0.15,
        shadowRadius: index === 0 ? 12 : 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: isTop3 ? 4 : 2,
      }}>
      {/* Rank accent bar */}
      <View
        className={`w-1 self-stretch ${
          index === 0
            ? 'bg-amber-400'
            : index === 1
              ? 'bg-zinc-300'
              : index === 2
                ? 'bg-amber-700'
                : 'bg-zinc-700'
        }`}
      />

      {/* Rank number */}
      <View className="w-12 items-center justify-center py-3">
        <View className={`h-8 w-8 items-center justify-center rounded-full ${rank.bg}`}>
          <Text className={`font-saira-bold text-sm ${rank.text}`}>{index + 1}</Text>
        </View>
      </View>

      {/* Avatar / Logo */}
      <View className="py-3 pr-3">
        {type === 'player' ? (
          <Avatar player={item} size={42} borderRadius={10} />
        ) : (
          <TeamLogo
            thickness={2}
            color1={item.crest.color1}
            color2={item.crest.color2}
            size={42}
            type={item.crest.type}
          />
        )}
      </View>

      {/* Name + subtitle */}
      <View className="flex-1 justify-center py-3" style={{ gap: 1 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="font-saira-semibold text-base text-white"
          style={{ letterSpacing: 0.2 }}>
          {type === 'player' ? `${item.first_name} ${item.surname}` : item.display_name}
        </Text>
        {(item.team_name || item.nickname) && (
          <Text numberOfLines={1} ellipsizeMode="tail" className="font-saira text-sm text-zinc-500">
            {type === 'player' ? (item.team_name ?? item.nickname) : item.division_name}
          </Text>
        )}
      </View>

      {/* Stat value */}
      <View className="items-end justify-center px-4 py-3" style={{ minWidth: 64 }}>
        <Text
          className={`font-saira-bold text-2xl ${
            index === 0
              ? 'text-amber-400'
              : index === 1
                ? 'text-zinc-300'
                : index === 2
                  ? 'text-amber-600'
                  : 'text-white'
          }`}
          style={{ letterSpacing: -0.5 }}>
          {getValue(item)}
        </Text>
        {label && (
          <Text
            className="font-saira text-xs uppercase text-zinc-600"
            style={{ letterSpacing: 0.8 }}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};
