import { View, Text, Image, StyleSheet } from 'react-native';

const podiumData = [
  {
    position: 2,
    name: 'Robert Fox',
    xp: 3148,
  },
  {
    position: 1,
    name: 'Dianne Russell',
    xp: 3579,
  },
  {
    position: 3,
    name: 'Wade Warren',
    xp: 2785,
  },
];

const heights = {
  2: 110,
  1: 140,
  3: 90,
};

const colors = {
  2: 'bg-theme-gray-5', // silver
  1: 'bg-theme-gray-4', // gold
  3: 'bg-theme-gray-3', // bronze
};

const LeaderboardPodium = () => {
  return (
    <View style={styles.container}>
      {podiumData.map((item) => (
        <View key={item.position} style={styles.podiumWrapper}>
          {/* Avatar */}
          <Image className="mb-1 h-16 w-16 rounded" source={require('@assets/avatar.jpg')} />

          {/* Name & XP */}
          <Text className={`text-text-on-brand font-saira-medium text-lg`}>{item.name}</Text>
          <Text className={`text-text-on-brand-2 mb-4 font-saira-regular`}>
            {item.xp.toLocaleString()} WINS
          </Text>

          {/* Trapezoid Top */}
          <View
            className="border-brand-light"
            style={
              item.position === 2
                ? styles.trapezoidLeft
                : item.position === 3
                  ? styles.trapezoidRight
                  : styles.trapezoidMiddle
            }
          />

          {/* Podium Block */}
          <View
            className={`w-30 h-20  items-center justify-center bg-brand shadow-lg`}
            style={[
              styles.block,
              {
                height: heights[item.position],
              },
            ]}>
            <Text style={{ lineHeight: 80 }} className={`font-saira-medium text-7xl text-white`}>
              {item.position}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default LeaderboardPodium;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 0,
  },
  podiumWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  name: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
  xp: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 6,
  },
  trapezoidLeft: {
    width: 120,
    height: 0,
    borderBottomWidth: 20,
    borderLeftWidth: 15,
    borderRightWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
    marginBottom: -1, // closes gap between trapezoid and block
  },
  trapezoidRight: {
    width: 120,
    height: 0,
    borderBottomWidth: 20,
    borderLeftWidth: 0,
    borderRightWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
    marginBottom: -1, // closes gap between trapezoid and block
  },
  trapezoidMiddle: {
    width: 120,
    height: 0,
    borderBottomWidth: 20,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
    marginBottom: -1, // closes gap between trapezoid and block
  },
  block: {
    width: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});
