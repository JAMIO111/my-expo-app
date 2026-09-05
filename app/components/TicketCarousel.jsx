import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import TicketCard from './TicketCard';

const MemoTicketCard = React.memo(TicketCard);

export default function TicketCarousel({
  tickets,
  sidePeek = 50,
  cardGap = 16,
  showLabel = true,
  showDots = true,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - sidePeek * 2;
  const snapInterval = cardWidth + cardGap;

  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndexRef = useRef(0);
  const scrollX = useSharedValue(0);

  // Runs on the JS thread but only when the rounded index actually changes,
  // so the vast majority of scroll frames never touch React state.
  const commitIndex = useCallback(
    (index) => {
      const clamped = Math.min(Math.max(index, 0), tickets.length - 1);
      if (clamped !== lastIndexRef.current) {
        lastIndexRef.current = clamped;
        setActiveIndex(clamped);
      }
    },
    [tickets.length]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / snapInterval);
      runOnJSIndex(index, commitIndex);
    },
  });

  const renderItem = useCallback(
    ({ item, index }) => (
      <View
        style={{
          width: cardWidth,
          marginRight: index === tickets.length - 1 ? 0 : cardGap,
        }}>
        <MemoTicketCard item={item} width={cardWidth} />
      </View>
    ),
    [cardWidth, cardGap, tickets.length]
  );

  const keyExtractor = useCallback((_, i) => String(i), []);

  const listData = useMemo(() => tickets, [tickets]);

  if (tickets.length === 0) return null;

  return (
    <View>
      <Animated.FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        snapToAlignment="start"
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingHorizontal: sidePeek }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />

      {(showLabel || showDots) && (
        <View className="mt-4 items-center">
          {showDots && (
            <View className="mb-2 flex-row">
              {tickets.map((_, i) => (
                <View
                  key={i}
                  className="mx-1 rounded-full"
                  style={{
                    width: i === activeIndex ? 22 : 8,
                    height: 8,
                    backgroundColor: i === activeIndex ? '#0b3910' : '#0b391066',
                  }}
                />
              ))}
            </View>
          )}

          {showLabel && (
            <Text className="font-tektur-medium text-sm tracking-wide text-text-2">
              {activeIndex + 1} of {tickets.length}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Small helper so the worklet above can hop back to the JS thread to update
 * React state. `runOnJS` from Reanimated must wrap the JS function at the
 * call site inside a worklet — this indirection keeps the import local.
 */
import { runOnJS } from 'react-native-reanimated';
function runOnJSIndex(index, fn) {
  'worklet';
  runOnJS(fn)(index);
}
