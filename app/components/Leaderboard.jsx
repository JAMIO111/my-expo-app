import { StyleSheet, Text, View } from 'react-native';

const Leaderboard = ({ title }) => {
  const stats = [
    { id: 1, name: 'Gareth Barry', value: 653 },
    { id: 2, name: 'Ryan Giggs', value: 632 },
    { id: 3, name: 'Frank Lampard', value: 609 },
    { id: 4, name: 'Steven Gerrard', value: 504 },
    { id: 5, name: 'Cesc Fabregas', value: 500 },
    { id: 6, name: 'Paul Scholes', value: 499 },
    { id: 7, name: 'David Silva', value: 490 },
    { id: 8, name: 'Yaya Toure', value: 480 },
    { id: 9, name: 'Thierry Henry', value: 475 },
    { id: 10, name: 'Michael Owen', value: 450 },
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
      <Text className="mb-2 pl-2 text-2xl font-bold text-white">{title}</Text>

      {stats.map((stat, index) => (
        <View key={stat.id} className="flex-row items-center justify-between p-2">
          {/* Left Side: Index, Avatar, Name */}
          <View className="min-w-0 flex-1 flex-row items-center">
            <Text className="w-6 text-white">{index + 1}</Text>

            {/* Avatar or initials */}
            {stat.avatar_url ? (
              <Image
                source={{ uri: stat?.avatar_url }}
                className="mr-2 h-11 w-11 rounded-md border border-separator"
                resizeMode="cover"
              />
            ) : (
              <View
                className="mr-2 h-11 w-11 rounded-md bg-brand-light"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text className="text-xl font-bold text-white">{getInitials(stat.name)}</Text>
              </View>
            )}

            {/* Name with ellipsis */}
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="text-lg font-semibold text-white">
                {stat.name}
              </Text>
            </View>
          </View>

          {/* Right Side: Stat Value */}
          <Text className="ml-3 text-xl font-bold text-white">{stat.value}</Text>
        </View>
      ))}
    </View>
  );
};

export default Leaderboard;

const styles = StyleSheet.create({});
