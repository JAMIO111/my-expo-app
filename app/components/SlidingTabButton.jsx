import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export default function SlidingTabButton({ onChange, option1 = 'Option A', option2 = 'Option B' }) {
  const { width } = useWindowDimensions();

  const padding = 3;
  const TAB_WIDTH = width - 32;
  const TAB_HEIGHT = 48;
  const THUMB_WIDTH = TAB_WIDTH / 2 - padding * 2;

  const translateX = useSharedValue(padding);

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const switchTo = (side) => {
    const toValue = side === 'left' ? padding : TAB_WIDTH / 2 + padding;
    translateX.value = withTiming(toValue, { duration: 200 });
    if (onChange) onChange(side);
  };

  return (
    <View style={[styles.wrapper, { width: TAB_WIDTH }]}>
      <View
        className="bg-background"
        style={[styles.container, { height: TAB_HEIGHT, borderRadius: TAB_HEIGHT / 5 }]}>
        <Animated.View
          className="bg-input-background"
          style={[
            styles.thumb,
            {
              width: THUMB_WIDTH,
              height: TAB_HEIGHT - padding * 2,
              top: padding,
              left: 0,
              borderRadius: (TAB_HEIGHT - padding * 2) / 5,
            },
            animatedThumbStyle,
          ]}
        />
        <Pressable style={styles.tab} onPress={() => switchTo('left')}>
          <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            className="text-text-1"
            style={styles.text}>
            {option1}
          </Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => switchTo('right')}>
          <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            className="text-text-1"
            style={styles.text}>
            {option2}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    marginVertical: 5,
  },
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  text: {
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  thumb: {
    position: 'absolute',
    zIndex: 0,
  },
});
