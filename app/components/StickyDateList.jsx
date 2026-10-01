import { View, Text } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';

const RADIUS = 24;
const GAP = 16; // space between day cards
const FADE_DISTANCE = 30; // px over which a day's card fades as its last edge reaches the pinned header

// Matches grouped by date, as rounded cards (like the Weather app). Each day is ONE clipped container
// (overflow hidden + constant corner radius) holding its header and rows; the header is pinned by
// translating it down inside the container as the list scrolls, so the container's clip shapes it
// perfectly as the card runs out. The whole card fades as its bottom reaches the pinned header.
//
// `backgroundClassName` should match the page behind the list: it fills the corners around the pinned
// header so rows scrolling underneath can't show through them.
export default function StickyDateList({
  grouped,
  renderItem,
  keyExtractor = (item) => String(item.id),
  contentContainerStyle,
  ListEmptyComponent = null,
  backgroundClassName = 'bg-brand-dark',
}) {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const days = grouped || [];
  const empty =
    typeof ListEmptyComponent === 'function' ? <ListEmptyComponent /> : ListEmptyComponent;

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={1}
      contentContainerStyle={contentContainerStyle ?? { paddingBottom: 30 }}>
      {days.length === 0
        ? empty
        : days.map(([date, items]) => (
            <DayCard
              key={date}
              date={date}
              scrollY={scrollY}
              backgroundClassName={backgroundClassName}>
              {items.map((item, index) => (
                <View
                  key={keyExtractor(item)}
                  className="bg-bg-grouped-2 px-2"
                  style={index === items.length - 1 ? { paddingBottom: 4 } : undefined}>
                  {renderItem(item, index, items.length)}
                </View>
              ))}
            </DayCard>
          ))}
    </Animated.ScrollView>
  );
}

function DayCard({ date, scrollY, backgroundClassName, children }) {
  const top = useSharedValue(0);
  const height = useSharedValue(0);
  const headerH = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => {
    // how far the card still extends below the pinned header
    const remaining = top.value + height.value - (scrollY.value + headerH.value);
    if (remaining >= FADE_DISTANCE) return { opacity: 1 };
    return {
      opacity: interpolate(remaining, [0, FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
    };
  });

  // pin the header to the top of the screen, but never let it leave the card
  const headerStyle = useAnimatedStyle(() => {
    const max = Math.max(height.value - headerH.value, 0);
    const y = Math.min(Math.max(scrollY.value - top.value, 0), max);
    return { transform: [{ translateY: y }] };
  });

  return (
    <Animated.View
      onLayout={(e) => {
        top.value = e.nativeEvent.layout.y;
        height.value = e.nativeEvent.layout.height;
      }}
      style={[{ borderRadius: RADIUS, overflow: 'hidden', marginBottom: GAP }, cardStyle]}>
      <Animated.View
        className={backgroundClassName}
        onLayout={(e) => {
          headerH.value = e.nativeEvent.layout.height;
        }}
        style={[{ zIndex: 1 }, headerStyle]}>
        <View
          className="bg-bg-grouped-2 px-4 pb-1 pt-3"
          style={{ borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS }}>
          <Text className="font-saira-semibold text-2xl text-text-1">
            {format(parseISO(date), 'EEE, d MMMM')}
          </Text>
        </View>
      </Animated.View>
      {children}
    </Animated.View>
  );
}
