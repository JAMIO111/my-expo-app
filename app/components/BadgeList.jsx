import { StyleSheet, View, Text, FlatList, Dimensions, Image } from 'react-native';
import { useState } from 'react';

const BADGE_SIZE = 100;
const NUM_COLUMNS = 3;
const ITEM_MARGIN = 10;

const badges = Array.from({ length: 12 }, (_, i) => ({
  id: i.toString(),
  label: `Badge ${i + 1}`,
}));

const BadgeList = () => {
  const [parentWidth, setParentWidth] = useState(null);

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setParentWidth(width);
  };

  const renderItem = ({ item }) => {
    if (!parentWidth) return null;

    const itemWidth = (parentWidth - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

    return (
      <View
        style={[styles.badgeContainer, { width: itemWidth, marginHorizontal: ITEM_MARGIN / 2 }]}>
        <View style={styles.badgeBG}>
          <Image
            source={require('@assets/LockedBadge.png')}
            style={styles.badgeImage}
            resizeMode="contain"
          />
        </View>
        <Text
          className="mt-2 pb-2 text-center font-saira-semibold text-lg text-text-1"
          style={styles.badgeText}>
          {item.label}
        </Text>
      </View>
    );
  };

  return (
    <View className="pt-6" onLayout={onLayout} style={styles.wrapper}>
      {parentWidth && (
        <FlatList
          data={badges}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          scrollEnabled={false}
          contentContainerStyle={styles.container}
        />
      )}
    </View>
  );
};

export default BadgeList;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {},
  badgeContainer: {
    alignItems: 'center',
    marginBottom: ITEM_MARGIN * 2,
  },
  badgeBG: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeImage: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
});
