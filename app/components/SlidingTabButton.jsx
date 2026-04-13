import { useState, useEffect, useRef } from 'react';
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
  const isFirstRender = useRef(true);

  const padding = 4;
  const TAB_HEIGHT = 50;
  const BORDER_WIDTH = 1;

  const innerHeight = TAB_HEIGHT - padding * 2 - BORDER_WIDTH * 2;

  const [containerWidth, setContainerWidth] = useState(0);

  const innerWidth = containerWidth > 0 ? containerWidth - BORDER_WIDTH * 2 : 0;

  const halfWidth = innerWidth / 2;

  const translateX = useSharedValue(0);

  const THUMB_WIDTH = innerWidth > 0 ? halfWidth - padding * 2 : 0;

  // Sync animation with external state
  useEffect(() => {
    if (!innerWidth) return;

    const toValue = value === 'left' ? padding : halfWidth + padding;

    if (isFirstRender.current) {
      translateX.value = toValue; // no animation on first render
      isFirstRender.current = false;
    } else {
      translateX.value = withTiming(toValue, { duration: 200 });
    }
  }, [value, innerWidth]);

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
          style={[
            styles.container,
            { borderWidth: BORDER_WIDTH, height: TAB_HEIGHT, borderRadius: TAB_HEIGHT / 3 },
          ]}
          className="bg-background">
          {/* Sliding thumb */}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                styles.thumb,
                {
                  width: THUMB_WIDTH,
                  height: innerHeight,
                  top: padding,
                  left: 0,
                  borderRadius: innerHeight / 3,
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
    borderColor: '#ccc',
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
