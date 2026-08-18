import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import IonIcon from 'react-native-vector-icons/Ionicons';

/**
 * TicketTapeBanner
 * A continuously scrolling, seamlessly looping ticket-style banner.
 *
 * items: array of { id, text, icon? }
 * speed: pixels per second (higher = faster)
 */
export default function TicketTapeBanner({
  items = [],
  speed = 40,
  backgroundColor = '#0B3D2E', // brand dark green
  textColor = '#F4E9CF',
  accentColor = '#D4AF37', // gold
  height = 44,
}) {
  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useSharedValue(0);

  const onContentLayout = useCallback(
    (e) => {
      const width = e.nativeEvent.layout.width;
      if (width > 0 && width !== contentWidth) {
        setContentWidth(width);

        cancelAnimation(translateX);
        translateX.value = 0;
        translateX.value = withRepeat(
          withTiming(-width, {
            duration: (width / speed) * 1000,
            easing: Easing.linear,
          }),
          -1, // infinite
          false // don't reverse — snap back to 0 for seamless loop
        );
      }
    },
    [contentWidth, speed, translateX]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!items.length) return null;

  const renderItems = (keyPrefix) =>
    items.map((item, index) => (
      <View key={`${keyPrefix}-${item.id ?? index}`} style={styles.itemRow}>
        {item.icon && (
          <IonIcon name={item.icon} size={14} color={accentColor} style={{ marginRight: 6 }} />
        )}
        <Text numberOfLines={1} style={[styles.itemText, { color: textColor }]}>
          {item.text}
        </Text>

        {/* Perforation divider between items */}
        <View style={styles.dividerGroup}>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
        </View>
      </View>
    ));

  return (
    <View style={[styles.container, { backgroundColor, height }]}>
      <View style={styles.track} pointerEvents="none">
        {/* First copy — measured to determine loop width */}
        <Animated.View style={[styles.row, animatedStyle]} onLayout={onContentLayout}>
          {renderItems('a')}
        </Animated.View>

        {/* Second copy — positioned immediately after the first so the
            loop is seamless once translateX resets from -width to 0 */}
        {contentWidth > 0 && (
          <Animated.View
            style={[styles.row, animatedStyle, { position: 'absolute', left: contentWidth }]}>
            {renderItems('b')}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    marginVertical: 32,
  },
  track: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  itemText: {
    fontFamily: 'Saira-SemiBold',
    fontSize: 14,
  },
  dividerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
});
