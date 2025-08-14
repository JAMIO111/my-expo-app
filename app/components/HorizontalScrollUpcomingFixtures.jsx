import { useState } from 'react';
import { View, ScrollView, Dimensions, Text } from 'react-native';
import UpcomingFixtureCard from './UpcomingFixtureCard';

const HorizontalScrollUpcomingFixtures = ({ fixtures, isLoading }) => {
  const screenWidth = Dimensions.get('window').width;
  const [cardWidth, setCardWidth] = useState(screenWidth * 0.65); // reasonable fallback width
  const gap = 0; // small gap

  if (isLoading)
    return (
      <View className="h-36 w-72 flex-1 items-center justify-center gap-3 rounded-2xl bg-bg-grouped-2 p-5">
        <View className="h-4 w-full rounded-full bg-theme-gray-4"></View>
        <View className="h-4 w-8 rounded-full bg-theme-gray-4"></View>
        <View className="h-4 w-full rounded-full bg-theme-gray-4"></View>
        <View className="w-full px-6">
          <View className="mt-2 h-3 w-full rounded-full bg-theme-gray-4"></View>
        </View>
      </View>
    );
  const isEmpty = !fixtures || fixtures.length === 0;

  const initialOffset = screenWidth / 2 - cardWidth / 2;

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
            <UpcomingFixtureCard fixture={fixture} />
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default HorizontalScrollUpcomingFixtures;
