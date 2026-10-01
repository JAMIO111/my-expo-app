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
const PIN_RAMP = 10; // px of scroll over which a header turns from flush-with-its-rows into a pill

// Matches grouped by date as rounded cards, with each day's date header pinned to the top while that
// day's matches scroll underneath. Headers are pinned natively (no scroll lag). A card is drawn from
// three pieces so the header can stick on its own: a header, side-bordered rows, and a rounded-bottom
// last row.
//
// While pinned, the header rounds its bottom corners too (and page-coloured corner pieces hide the rows
// behind the curves), so it reads as a pill. The gap between cards lives at the top of each header,
// so when the next header pushes a pinned one away, the pinned pill ends exactly where its own card
// does - with the same rounded bottom corners - instead of overhanging into the gap.
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

  const starts = useMemo(() => {
    const out = {};
    let offset = 0;
    sections.forEach((section) => {
      out[section.date] = offset;
      offset += heights.current[`h-${section.date}`] ?? 0;
      section.data.forEach((item, idx) => {
        const h = heights.current[`i-${keyExtractor(item)}`] ?? 0;
        // rows overlap the next cell by SEAM (negative margin), which onLayout doesn't include
        offset += idx === section.data.length - 1 ? h : h - SEAM;
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
          spaced={sections.indexOf(section) > 0}
          start={starts[section.date]}
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
              marginBottom: last ? 0 : -SEAM,
            }}>
            <View
              className="border-x border-theme-gray-5 bg-bg-grouped-2 px-2"
              style={
                last
                  ? {
                      paddingBottom: 4,
                      borderBottomWidth: 1,
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

function DayHeader({ date, spaced, start, scrollY, pageColor, onMeasure }) {
  // 0 while the header sits at its own place in the list, 1 once it is pinned over rows
  const pinStyle = useAnimatedStyle(() => {
    const pinned = interpolate(scrollY.value - start, [0, PIN_RAMP], [0, 1], Extrapolation.CLAMP);
    return {
      borderBottomLeftRadius: pinned * RADIUS,
      borderBottomRightRadius: pinned * RADIUS,
    };
  }, [start]);

  const maskStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value - start, [0, PIN_RAMP], [0, 1], Extrapolation.CLAMP),
    };
  }, [start]);

  return (
    <View
      // the page-coloured gap above a card; it also hides rows scrolling under a pinned header
      style={{ paddingTop: spaced ? GAP : 0, backgroundColor: pageColor }}
      onLayout={(e) => onMeasure(`h-${date}`, e.nativeEvent.layout.height)}>
      <View>
        <Animated.View
          className="border-x border-t border-theme-gray-5 bg-bg-grouped-2 px-4 pb-1 pt-3"
          style={[{ borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS }, pinStyle]}>
          <Text className="font-saira-semibold text-2xl text-text-1">
            {format(parseISO(date), 'EEE, d MMMM')}
          </Text>
        </Animated.View>
        {/* fill the square corners outside the header's rounded corners, so rows scrolling underneath
            a pinned header can't show through them */}
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
      </View>
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
