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
  1: 140,
  2: 110,
  3: 90,
};

const colors = {
  1: '#FFD700', // gold
  2: '#C0C0C0', // silver
  3: '#CD7F32', // bronze
};

const LeaderboardPodium = () => {
  const sorted = [...podiumData].sort((a, b) => a.position - b.position);

  return (
    <View style={styles.container}>
      {sorted.map((item) => (
        <View key={item.position} style={styles.podiumWrapper}>
          {/* Avatar */}
          <Image source={require('@assets/avatar.jpg')} style={styles.avatar} />

          {/* Name & XP */}
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.xp}>{item.xp.toLocaleString()} XP</Text>

          {/* Podium block */}
          <View
            style={[
              styles.block,
              {
                height: heights[item.position],
                backgroundColor: colors[item.position],
              },
            ]}>
            <Text style={styles.position}>{item.position}</Text>
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
    padding: 20,
    gap: 16,
  },
  podiumWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 4,
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
  block: {
    width: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  position: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 8,
    color: 'black',
  },
});
