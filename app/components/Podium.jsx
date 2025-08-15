import { View, Text, Image, StyleSheet } from 'react-native';
import TeamLogo from '@components/TeamLogo';
import Avatar from './Avatar';

const heights = {
  0: 140, // 1st
  1: 110, // 2nd
  2: 90, // 3rd
};

const medals = {
  0: require('@assets/gold-medal.png'),
  1: require('@assets/silver-medal.png'),
  2: require('@assets/bronze-medal.png'),
};

const LeaderboardPodium = ({ data, statKey, type, label }) => {
  const getValue =
    typeof statKey === 'function'
      ? statKey
      : (item) =>
          item?.[statKey] ?? // top-level stat
          item?.stats?.[statKey] ?? // nested inside `stats`
          0;

  // Ensure we only use the top 3
  const podium = data.slice(0, 3);

  // Arrange visually: [2nd, 1st, 3rd]
  const layoutOrder = [1, 0, 2]; // index positions to show

  return (
    <View style={styles.container}>
      {layoutOrder.map((orderIndex) => {
        const item = podium[orderIndex];
        const index = orderIndex;

        if (!item) return null;

        const trapezoidStyle =
          index === 0
            ? styles.trapezoidLeft
            : index === 2
              ? styles.trapezoidRight
              : styles.trapezoidMiddle;

        const height = heights[index] || 100;

        return (
          <View key={index} style={[styles.podiumWrapper, { width: 120 }]}>
            {/* Name */}
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                marginTop: 8,
                fontFamily: 'Saira-Medium',
                fontSize: 18,
                color: '#fff',
                maxWidth: 110, // ensures text won't push layout
                textAlign: 'center',
                lineHeight: 24,
              }}>
              {type === 'player' ? `${`${item.first_name} ${item.surname}`}` : item.display_name}
            </Text>

            {/* Stat */}
            <Text
              style={{
                marginBottom: 12,
                fontFamily: 'Saira-Regular',
                fontSize: 16,
                color: '#ccc',
                maxWidth: 110,
                textAlign: 'center',
              }}>
              {getValue(item)} {label || ''}
            </Text>

            {/* Avatar or Logo */}
            {type === 'player' ? (
              <View style={{ marginBottom: 4 }}>
                <Avatar player={item} size={70} borderRadius={8} />
              </View>
            ) : (
              <TeamLogo
                thickness={item?.crest?.thickness}
                color1={item?.crest?.color1}
                color2={item?.crest?.color2}
                size={80}
                type={item?.crest?.type}
              />
            )}

            {/* Trapezoid */}
            <View className="border-brand-light" style={trapezoidStyle} />

            {/* Podium Block */}
            <View
              className={`items-center justify-center bg-brand shadow-lg`}
              style={[styles.block, { height, width: 120 }]}>
              <Image
                source={medals[index]}
                style={{
                  position: 'absolute',
                  top: 0,
                  height: 80,
                  width: 48,
                  resizeMode: 'contain',
                }}
              />
            </View>
          </View>
        );
      })}
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
  trapezoidMiddle: {
    width: 120,
    height: 0,
    borderBottomWidth: 20,
    borderLeftWidth: 15,
    borderRightWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
    marginBottom: -1,
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
    marginBottom: -1,
  },
  trapezoidLeft: {
    width: 120,
    height: 0,
    borderBottomWidth: 20,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
    marginBottom: -1,
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
