import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function SlidingTabButton({
  value = 'left',
  onChange,
  option1 = 'Option A',
  option2 = 'Option B',
}) {
  const padding = 3;
  const TAB_HEIGHT = 48;

  const [containerWidth, setContainerWidth] = useState(0);

  const translateX = useSharedValue(padding);

  const THUMB_WIDTH = containerWidth > 0 ? containerWidth / 2 - padding * 2 : 0;

  // Sync animation with external state
  useEffect(() => {
    if (!containerWidth) return;

    const toValue = value === 'left' ? padding : containerWidth / 2 + padding;

    translateX.value = withTiming(toValue, { duration: 200 });
  }, [value, containerWidth]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = (side) => {
    if (onChange) onChange(side);
  };

  const swipeGesture = Gesture.Pan().onEnd((event) => {
    const SWIPE_THRESHOLD = containerWidth / 6;

    if (event.translationX > SWIPE_THRESHOLD) {
      runOnJS(handlePress)('right'); // swipe right → right tab
    } else if (event.translationX < -SWIPE_THRESHOLD) {
      runOnJS(handlePress)('left'); // swipe left → left tab
    }
  });

  return (
    <View style={styles.wrapper} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <GestureDetector gesture={swipeGesture}>
        <View
          style={[styles.container, { height: TAB_HEIGHT, borderRadius: TAB_HEIGHT / 3 }]}
          className="bg-background">
          {/* Sliding thumb */}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                styles.thumb,
                {
                  width: THUMB_WIDTH,
                  height: TAB_HEIGHT - padding * 2,
                  top: padding,
                  left: 0,
                  borderRadius: (TAB_HEIGHT - padding * 2) / 3,
                },
                animatedThumbStyle,
              ]}
              className="bg-input-background shadow-sm"
            />
          )}

          {/* Left tab */}
          <Pressable style={styles.tab} onPress={() => handlePress('left')}>
            <Text style={styles.text} className="text-text-1">
              {option1}
            </Text>
          </Pressable>

          {/* Right tab */}
          <Pressable style={styles.tab} onPress={() => handlePress('right')}>
            <Text style={styles.text} className="text-text-1">
              {option2}
            </Text>
          </Pressable>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%', // 👈 respects parent padding
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
