import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, SectionList } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@contexts/ThemeProvider';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const RADIUS = 24; // matches rounded-3xl
const GAP = 16; // space between day cards
// Cells are separate views, so fractional layout positions can leave hairline gaps between them where
// the page shows through. Cells paint SEAM px into the next one (same colour) to close those gaps.
const SEAM = 1;

// Matches grouped by date as rounded cards, with each day's date header pinned to the top while that
// day's matches scroll underneath. Headers are pinned natively (no scroll lag). A card is drawn from
// three pieces so the header can stick on its own: a header, side-bordered rows, and a rounded-bottom
// last row.
//
// Only at the very end of a day, as the next day's header pushes the pinned one away, does the header
// round its bottom corners (with page-coloured corner pieces hiding the rows behind the curves) and
// slide up an extra GAP, so it finishes exactly where its own card does - a pill matching the card's
// rounded bottom - instead of overhanging into the gap between cards.
//
// Put it inside a rounded `overflow-hidden` wrapper to round the list's top edge.
// `backgroundColor` should match the page behind the list (defaults to the theme's brand-dark).
export default function StickyDateList({
  grouped,
  renderItem,
  keyExtractor = (item) => String(item.id),
  contentContainerStyle,
  backgroundColor,
}) {
  const { colors } = useTheme();
  const pageColor = backgroundColor ?? colors.brandDark;
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

  // Measured cell heights, so each header's resting position in the list is known.
  const heights = useRef({});
  const [version, setVersion] = useState(0);
  const measure = useCallback((key, height) => {
    if (heights.current[key] !== height) {
      heights.current[key] = height;
      setVersion((v) => v + 1);
    }
  }, []);

  // Where each header sits in the list, and where the next one does (null for the last day).
  const starts = useMemo(() => {
    const out = {};
    let offset = 0;
    sections.forEach((section) => {
      out[section.date] = offset;
      offset += heights.current[`h-${section.date}`] ?? 0;
      section.data.forEach((item, idx) => {
        const h = heights.current[`i-${keyExtractor(item)}`] ?? 0;
        // rows overlap the next cell by SEAM (negative margin) and the last carries the GAP below its
        // card; neither is included in onLayout heights
        offset += idx === section.data.length - 1 ? h + GAP : h - SEAM;
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, version]);

  return (
    <AnimatedSectionList
      sections={sections}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      extraData={starts}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={1}
      // lists here are one month long: keep every row mounted so positions are known up front
      initialNumToRender={60}
      windowSize={21}
      contentContainerStyle={contentContainerStyle ?? { paddingBottom: 30 }}
      renderSectionHeader={({ section }) => (
        <DayHeader
          date={section.date}
          next={starts[sections[sections.indexOf(section) + 1]?.date] ?? null}
          headerH={heights.current[`h-${section.date}`] ?? 0}
          scrollY={scrollY}
          pageColor={pageColor}
          onMeasure={measure}
        />
      )}
      renderItem={({ item, index, section }) => {
        const last = index === section.data.length - 1;
        return (
          <View
            onLayout={(e) => measure(`i-${keyExtractor(item)}`, e.nativeEvent.layout.height)}
            style={{
              // overlap into the neighbouring cells (the header above, the next row below)
              marginTop: index === 0 ? -SEAM : 0,
              marginBottom: last ? GAP : -SEAM,
            }}>
            <View
              className=" bg-bg-grouped-2 px-2"
              style={
                last
                  ? {
                      paddingBottom: 4,

                      borderBottomLeftRadius: RADIUS,
                      borderBottomRightRadius: RADIUS,
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

function DayHeader({ date, next, headerH, scrollY, pageColor, onMeasure }) {
  // How far the header is being pushed up by the next one (0 until it starts), and how much of the
  // day's rows are still showing under it: both only matter at the very end of the day.
  const radiusStyle = useAnimatedStyle(() => {
    if (next === null || headerH === 0) return {};
    const remaining = next - (scrollY.value + headerH);
    const rowsBelow = remaining - GAP;
    const radius = interpolate(rowsBelow, [0, RADIUS], [RADIUS, 0], Extrapolation.CLAMP);
    return {
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };
  }, [next, headerH]);

  const shiftStyle = useAnimatedStyle(() => {
    if (next === null || headerH === 0) return {};
    const remaining = next - (scrollY.value + headerH);
    return {
      transform: [
        { translateY: -interpolate(remaining, [0, -GAP], [0, GAP], Extrapolation.CLAMP) },
      ],
    };
  }, [next, headerH]);

  const maskStyle = useAnimatedStyle(() => {
    if (next === null || headerH === 0) return { opacity: 0 };
    const remaining = next - (scrollY.value + headerH);
    return {
      opacity: interpolate(remaining, [0, RADIUS], [1, 0], Extrapolation.CLAMP),
    };
  }, [next, headerH]);

  return (
    <View onLayout={(e) => onMeasure(`h-${date}`, e.nativeEvent.layout.height)}>
      <Animated.View style={shiftStyle}>
        <Animated.View
          className="bg-bg-grouped-2 px-4 pb-1 pt-3"
          style={[{ borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS }, radiusStyle]}>
          <Text className="font-saira-semibold text-2xl text-text-1">
            {format(parseISO(date), 'EEE, d MMMM')}
          </Text>
        </Animated.View>
        {/* fill the square corners outside the header's rounded top, so rows scrolling underneath a
            pinned header can't show through them */}
        <CornerMask color={pageColor} />
        <CornerMask color={pageColor} right />
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, right: 0, bottom: 0, height: RADIUS },
            maskStyle,
          ]}>
          <CornerMask color={pageColor} bottom />
          <CornerMask color={pageColor} bottom right />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// An inverse quarter-circle: the square corner OUTSIDE a rounded corner, in the page colour.
function CornerMask({ color, right, bottom }) {
  const transform = [];
  if (right) transform.push({ scaleX: -1 });
  if (bottom) transform.push({ scaleY: -1 });
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        [bottom ? 'bottom' : 'top']: 0,
        [right ? 'right' : 'left']: 0,
        width: RADIUS,
        height: RADIUS,
        transform: transform.length ? transform : undefined,
      }}>
      <Svg width={RADIUS} height={RADIUS} viewBox={`0 0 ${RADIUS} ${RADIUS}`}>
        <Path d={`M0 0 H${RADIUS} A${RADIUS} ${RADIUS} 0 0 0 0 ${RADIUS} Z`} fill={color} />
      </Svg>
    </View>
  );
}
