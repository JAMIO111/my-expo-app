import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, SectionList } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const RADIUS = 24;
const GAP = 16; // space between day cards
const FADE_DISTANCE = 30; // px over which a pinned header fades before the next day takes over

// Matches grouped by date, as rounded cards whose date header stays pinned to the top while that day's
// matches scroll underneath (like the Weather app), fading out just before the next day's header takes
// its place. Each card is drawn from three pieces so the header can stick on its own: a rounded-top
// header, side-bordered rows, and a rounded-bottom last row.
//
// `backgroundClassName` should match the page behind the list: it fills the corners around a pinned
// header so rows scrolling underneath can't show through them.
export default function StickyDateList({
  grouped,
  renderItem,
  keyExtractor = (item) => String(item.id),
  contentContainerStyle,
  ListEmptyComponent = null,
  backgroundClassName = 'bg-brand-dark',
}) {
  const sections = useMemo(
    () => (grouped || []).map(([date, data]) => ({ date, data })),
    [grouped]
  );

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Measured heights of every cell (headers and rows), so each day's end position is known and its header
  // can fade as that end approaches.
  const heights = useRef({});
  const [version, setVersion] = useState(0);
  const measure = useCallback((key, height) => {
    if (heights.current[key] !== height) {
      heights.current[key] = height;
      setVersion((v) => v + 1);
    }
  }, []);

  // For each date: the header's height, and the content offset where that day's last row ends.
  const layout = useMemo(() => {
    const out = {};
    let offset = 0;
    for (const section of sections) {
      const headerH = heights.current[`h-${section.date}`];
      let complete = headerH !== undefined;
      offset += headerH ?? 0;
      for (const item of section.data) {
        const h = heights.current[`i-${keyExtractor(item)}`];
        if (h === undefined) complete = false;
        offset += h ?? 0;
      }
      out[section.date] = complete ? { headerH, end: offset } : null;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, version]);

  return (
    <AnimatedSectionList
      sections={sections}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      extraData={layout}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      // lists here are one month long: keep every row mounted so heights are known up front
      initialNumToRender={60}
      windowSize={21}
      contentContainerStyle={contentContainerStyle ?? { paddingBottom: 30 }}
      ListEmptyComponent={ListEmptyComponent}
      renderSectionHeader={({ section }) => (
        <DayHeader
          date={section.date}
          spaced={sections.indexOf(section) > 0}
          info={layout[section.date]}
          scrollY={scrollY}
          onMeasure={measure}
          backgroundClassName={backgroundClassName}
        />
      )}
      renderItem={({ item, index, section }) => {
        const last = index === section.data.length - 1;
        return (
          <View onLayout={(e) => measure(`i-${keyExtractor(item)}`, e.nativeEvent.layout.height)}>
            <View
              className="border-x border-theme-gray-5 bg-bg-grouped-2 px-2"
              style={
                last
                  ? {
                      borderBottomWidth: 1,
                      borderBottomLeftRadius: RADIUS,
                      borderBottomRightRadius: RADIUS,
                      paddingBottom: 4,
                    }
                  : undefined
              }>
              {renderItem(item, index, section.data.length)}
            </View>
          </View>
        );
      }}
    />
  );
}

function DayHeader({ date, spaced, info, scrollY, onMeasure, backgroundClassName }) {
  const end = info ? info.end : null;
  const headerH = info ? info.headerH : 0;

  const fadeStyle = useAnimatedStyle(() => {
    if (end === null) return { opacity: 1 };
    const remaining = end - (scrollY.value + headerH);
    return {
      opacity: interpolate(remaining, [0, FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
    };
  }, [end, headerH]);

  const style = useAnimatedStyle(() => {
    if (end === null) return {};
    // how far the day's last row still extends below the pinned header
    const remaining = end - (scrollY.value + headerH) + 7;
    const radius = interpolate(remaining, [0, RADIUS], [RADIUS, 0], Extrapolation.CLAMP);
    return {
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };
  }, [end, headerH]);

  return (
    <View
      className={backgroundClassName}
      style={{ paddingTop: spaced ? GAP : 0 }}
      onLayout={(e) => onMeasure(`h-${date}`, e.nativeEvent.layout.height)}>
      <Animated.View
        className="border-x border-t border-theme-gray-5 bg-bg-grouped-2 px-4 pb-1 pt-3"
        style={[{ borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS }, style, fadeStyle]}>
        <Text className="font-saira-semibold text-2xl text-text-1">
          {format(parseISO(date), 'EEE, d MMMM')}
        </Text>
      </Animated.View>
    </View>
  );
}
