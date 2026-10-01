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
// Cells used to overlap by 1px to hide possible hairline gaps, but with each row fading on its own the
// overlapping strips double-composited into a dark/light line. Kept as a constant in case a seam fix
// is needed again; 0 means no overlap.
const SEAM = 0;
const GAP = 16; // space between day cards
const DEFAULT_HEADER_H = 52;
const ROW_FADE = 28; // px over which a row fades out as it reaches the pinned header

// Matches grouped by date, as rounded cards, in the style of the iOS Weather app. Each day's date header
// is pinned natively (no scroll lag). As you scroll, that day's rows fade out as they reach the header, so
// the card shrinks to just its header (a pill), which then fades while the next day's card slides over it.
//
// To make that work the header cell has ZERO layout height and its card is drawn overflowing below it;
// the first row reserves the header's height itself. A zero-height sticky header is never "pushed" by
// the next one, and later headers/rows paint over earlier ones. Because rows are transparent by the time
// they reach the header, nothing shows through its rounded corners and it needs no backing.
export default function StickyDateList({
  grouped,
  renderItem,
  keyExtractor = (item) => String(item.id),
  contentContainerStyle,
  ListEmptyComponent = null,
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

  // Measured row cell heights (they include the reserved header space and the gap below a day).
  const heights = useRef({});
  const [version, setVersion] = useState(0);
  const measure = useCallback((key, height) => {
    if (heights.current[key] !== height) {
      heights.current[key] = height;
      setVersion((v) => v + 1);
    }
  }, []);

  // `ends[date]`: content offset where the next day's card starts (null for the last day / unmeasured).
  // `bottoms[key]`: content offset of each row's bottom edge (null until measured).
  const { ends, bottoms } = useMemo(() => {
    const ends = {};
    const bottoms = {};
    let offset = 0;
    sections.forEach((section, i) => {
      let complete = true;
      section.data.forEach((item, idx) => {
        const key = keyExtractor(item);
        const h = heights.current[key];
        const last = idx === section.data.length - 1;
        if (h === undefined) {
          complete = false;
          bottoms[key] = null;
          return;
        }
        // non-last rows overlap the next one by SEAM (negative margin), which onLayout doesn't include
        offset += h - (last ? 0 : SEAM);
        // a day's last row also carries the GAP below the card, which isn't part of the visible card
        bottoms[key] = last ? offset - GAP : offset;
      });
      ends[section.date] = complete && i < sections.length - 1 ? offset : null;
    });
    return { ends, bottoms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, version]);

  return (
    <AnimatedSectionList
      sections={sections}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      extraData={{ ends, bottoms, headerH }}
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
        />
      )}
      renderItem={({ item, index, section }) => {
        const key = keyExtractor(item);
        const first = index === 0;
        const last = index === section.data.length - 1;
        return (
          <Row
            bottom={bottoms[key]}
            headerH={headerH}
            scrollY={scrollY}
            onLayout={(e) => measure(key, e.nativeEvent.layout.height)}
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
          </Row>
        );
      }}
    />
  );
}

// A row fades out as its bottom edge reaches the pinned header, so the card appears to shrink away.
function Row({ bottom, headerH, scrollY, onLayout, style, children }) {
  const fadeStyle = useAnimatedStyle(() => {
    if (bottom === null) return { opacity: 1 };
    return {
      opacity: interpolate(
        bottom - (scrollY.value + headerH),
        [0, ROW_FADE],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  }, [bottom, headerH]);

  return (
    <Animated.View onLayout={onLayout} style={[style, fadeStyle]}>
      {children}
    </Animated.View>
  );
}

function DayHeader({ date, end, headerH, scrollY, onHeaderMeasure }) {
  // once the day's rows have run out the header is all that's left, so round it off into a pill
  const shapeStyle = useAnimatedStyle(() => {
    if (end === null) return {};
    const remaining = end - GAP - (scrollY.value + headerH);
    const radius = interpolate(remaining, [0, RADIUS], [RADIUS, 0], Extrapolation.CLAMP);
    return { borderBottomLeftRadius: radius, borderBottomRightRadius: radius };
  }, [end, headerH]);

  // the pill fades as the next card's top edge sweeps up over it: 1 until they touch, 0 once covered
  const fadeStyle = useAnimatedStyle(() => {
    if (end === null) return { opacity: 1 };
    return {
      opacity: interpolate(end - scrollY.value, [0, headerH], [0, 1], Extrapolation.CLAMP),
    };
  }, [end, headerH]);

  return (
    // zero height: never pushed off by the next header, content overflows downwards
    <View style={{ height: 0 }}>
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, fadeStyle]}
        onLayout={(e) => onHeaderMeasure(e.nativeEvent.layout.height)}>
        <Animated.View
          className="bg-bg-grouped-2 px-4 pt-3"
          style={[
            {
              borderTopLeftRadius: RADIUS,
              borderTopRightRadius: RADIUS,
              paddingBottom: 4 + SEAM,
            },
            shapeStyle,
          ]}>
          <Text className="font-saira-semibold text-2xl text-text-1">
            {format(parseISO(date), 'EEE, d MMMM')}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
