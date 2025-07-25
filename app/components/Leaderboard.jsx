import { StyleSheet, Text, View } from 'react-native';
import TeamLogo from '@components/TeamLogo';

const Leaderboard = ({ title, type }) => {
  const playerStats = [
    { id: 1, name: 'Jamie Dryden', value: 653 },
    { id: 2, name: 'Jack Smith', value: 632 },
    { id: 3, name: 'David Walton', value: 609 },
    { id: 4, name: 'John Doe', value: 504 },
    { id: 5, name: 'Jane Smith', value: 500 },
    { id: 6, name: 'Emily Johnson', value: 499 },
    { id: 7, name: 'Michael Brown', value: 490 },
    { id: 8, name: 'Sarah Davis', value: 480 },
    { id: 9, name: 'Chris Wilson', value: 475 },
    { id: 10, name: 'Jessica Taylor', value: 450 },
  ];

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names
      .map((n) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <View className="min-w-[300px] rounded-3xl bg-brand p-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <Text className="mb-2 pl-2 font-saira-semibold text-2xl text-white">{title}</Text>

      {playerStats.map((stat, index) => (
        <View key={stat.id} className="flex-row items-center justify-between p-2">
          {/* Left Side: Index, Avatar, Name */}
          <View className="min-w-0 flex-1 flex-row items-center">
            <Text className="w-6 font-saira text-white">{index + 1}.</Text>
            {type === 'team' ? (
              <View className="px-2">
                <TeamLogo
                  size={30}
                  type={stat?.crest?.type}
                  color1={stat?.crest?.color1}
                  color2={stat?.crest?.color2}
                  thickness={stat?.crest?.thickness}
                />
              </View>
            ) : stat?.avatar_url ? (
              <Image
                source={{ uri: stat.avatar_url }}
                className="mr-2 h-11 w-11 rounded-md border border-separator"
                resizeMode="cover"
              />
            ) : (
              <View
                className="mr-2 h-11 w-11 rounded-md bg-brand-light"
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text className="font-saira-bold text-xl text-white">{getInitials(stat.name)}</Text>
              </View>
            )}

            {/* Name with ellipsis */}
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="font-saira-semibold text-lg text-white">
                {stat.name}
              </Text>
            </View>
          </View>

          {/* Right Side: Stat Value */}
          <Text className="ml-3 font-saira-bold text-2xl text-white">{stat.value}</Text>
        </View>
      ))}
    </View>
  );
};

export default Leaderboard;

const styles = StyleSheet.create({});
