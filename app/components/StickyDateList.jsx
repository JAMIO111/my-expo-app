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
// Each row/header is its own cell, so fractional layout positions can leave hairline gaps between them
// where the page shows through. Cells paint SEAM px into the next one (same colour) to close them.
const SEAM = 1;
const GAP = 16; // space between day cards
const DEFAULT_HEADER_H = 52;

// Matches grouped by date, as rounded cards. Each day's date header is pinned natively (no scroll lag)
// and, rather than being pushed off by the next day, stays put while the next day's card slides over
// the top of it: the pinned header becomes a pill, then fades as it is covered.
//
// To make that work the header cell has ZERO layout height and its card is drawn overflowing below it;
// the first row reserves the header's height itself. A zero-height sticky header is never "pushed"
// by the next one, and later headers/rows paint over earlier ones.
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

  const [headerH, setHeaderH] = useState(DEFAULT_HEADER_H);
  const onHeaderMeasure = useCallback((h) => {
    setHeaderH((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
  }, []);

  // Measured row cell heights (they include the reserved header space and the gap below a day), so each
  // day's end - where the next day's card begins - is known.
  const heights = useRef({});
  const [version, setVersion] = useState(0);
  const measure = useCallback((key, height) => {
    if (heights.current[key] !== height) {
      heights.current[key] = height;
      setVersion((v) => v + 1);
    }
  }, []);

  // For each date: the content offset where the next day's card starts (null for the last day).
  const ends = useMemo(() => {
    const out = {};
    let offset = 0;
    sections.forEach((section, i) => {
      let complete = true;
      section.data.forEach((item, idx) => {
        const h = heights.current[keyExtractor(item)];
        if (h === undefined) complete = false;
        // non-last rows overlap the next one by SEAM (negative margin), which onLayout doesn't include
        offset += (h ?? 0) - (idx === section.data.length - 1 ? 0 : SEAM);
      });
      out[section.date] = complete && i < sections.length - 1 ? offset : null;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, version]);

  return (
    <AnimatedSectionList
      sections={sections}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      extraData={{ ends, headerH }}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={1}
      // lists here are one month long: keep every row mounted so heights are known up front
      initialNumToRender={60}
      windowSize={21}
      contentContainerStyle={contentContainerStyle ?? { paddingBottom: 30 }}
      ListEmptyComponent={ListEmptyComponent}
      renderSectionHeader={({ section }) => (
        <DayHeader
          date={section.date}
          end={ends[section.date]}
          headerH={headerH}
          scrollY={scrollY}
          onHeaderMeasure={onHeaderMeasure}
          backgroundClassName={backgroundClassName}
        />
      )}
      renderItem={({ item, index, section }) => {
        const first = index === 0;
        const last = index === section.data.length - 1;
        return (
          <View
            onLayout={(e) => measure(keyExtractor(item), e.nativeEvent.layout.height)}
            style={{
              // room for the pinned header's card, which is drawn over this space
              paddingTop: first ? headerH - SEAM : 0,
              paddingBottom: last ? GAP : 0,
              marginBottom: last ? 0 : -SEAM,
            }}>
            <View
              className="bg-bg-grouped-2 px-2"
              style={
                last
                  ? {
                      borderBottomLeftRadius: RADIUS,
                      borderBottomRightRadius: RADIUS,
                      paddingBottom: 4,
                    }
                  : { paddingBottom: SEAM }
              }>
              {renderItem(item, index, section.data.length)}
            </View>
          </View>
        );
      }}
    />
  );
}

function DayHeader({ date, end, headerH, scrollY, onHeaderMeasure, backgroundClassName }) {
  const cardStyle = useAnimatedStyle(() => {
    if (end === null) return { opacity: 1 };
    // how far this day's rows still extend below the pinned header (negative once they've run out)
    const remaining = end - GAP - (scrollY.value + headerH);
    const radius = interpolate(remaining, [0, RADIUS], [RADIUS, 0], Extrapolation.CLAMP);
    // the next card's top edge sweeping up over the header: 1 until it touches, 0 once it fully covers
    const uncovered = interpolate(end - scrollY.value, [0, headerH], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: uncovered,
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };
  }, [end, headerH]);

  return (
    // zero height: never pushed off by the next header, content overflows downwards
    <View style={{ height: 0 }}>
      <View
        className={backgroundClassName}
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        onLayout={(e) => onHeaderMeasure(e.nativeEvent.layout.height)}>
        <Animated.View
          className="bg-bg-grouped-2 px-4 pt-3"
          style={[
            {
              borderTopLeftRadius: RADIUS,
              borderTopRightRadius: RADIUS,
              paddingBottom: 4 + SEAM,
            },
            cardStyle,
          ]}>
          <Text className="font-saira-semibold text-2xl text-text-1">
            {format(parseISO(date), 'EEE, d MMMM')}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
