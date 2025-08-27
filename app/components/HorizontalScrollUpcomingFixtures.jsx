import { useState } from 'react';
import { View, ScrollView, Dimensions, Text } from 'react-native';
import UpcomingFixtureCard from './UpcomingFixtureCard';
import { UpcomingFixtureSkeleton } from './Skeletons';

const HorizontalScrollUpcomingFixtures = ({ fixtures, isLoading }) => {
  const screenWidth = Dimensions.get('window').width;
  const [cardWidth, setCardWidth] = useState(screenWidth * 0.65);
  const gap = 8;

  const isEmpty = !fixtures || fixtures.length === 0;
  const initialOffset = screenWidth / 2 - cardWidth / 2;

  // Skeleton view uses the same width as cards so layout is stable
  if (isLoading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: initialOffset,
          alignItems: 'center',
        }}
        snapToInterval={cardWidth + gap}
        decelerationRate="fast"
        snapToAlignment="start"
        className="w-full pb-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <View
            key={index}
            className="h-36 items-center justify-center rounded-2xl px-4"
            style={{ width: cardWidth, marginRight: index < 2 ? gap : 0 }}>
            <UpcomingFixtureSkeleton />
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: initialOffset,
        alignItems: 'center',
      }}
      snapToInterval={cardWidth + gap}
      decelerationRate="fast"
      snapToAlignment="start"
      className="w-full py-2">
      {isEmpty ? (
        <View
          className="h-32 items-center justify-center rounded-2xl bg-bg-grouped-2"
          style={{ width: cardWidth }}>
          <Text className="font-saira text-xl text-text-2">No Upcoming Fixtures</Text>
        </View>
      ) : (
        fixtures.map((fixture, index) => (
          <View
            key={index}
            onLayout={index === 0 ? (e) => setCardWidth(e.nativeEvent.layout.width) : undefined}
            style={{
              width: cardWidth,
              marginRight: index === fixtures.length - 1 ? 0 : gap,
            }}>
            <UpcomingFixtureCard cardShadow="shadow-gray" fixture={fixture} />
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default HorizontalScrollUpcomingFixtures;
