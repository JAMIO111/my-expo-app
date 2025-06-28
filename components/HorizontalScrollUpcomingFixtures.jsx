import React, { useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import UpcomingFixtureCard from './UpcomingFixtureCard';

const HorizontalScrollUpcomingFixtures = () => {
  const screenWidth = Dimensions.get('window').width;
  const [cardWidth, setCardWidth] = useState(0);
  const gap = 16; // Adjust this value as needed for spacing between cards

  const initialOffset = cardWidth > 0 ? screenWidth / 2 - cardWidth / 2 - gap : 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingLeft: initialOffset,
        alignItems: 'center',
        gap,
      }}
      pagingEnabled
      snapToAlignment="start"
      snapToInterval={cardWidth + gap}
      decelerationRate="fast"
      className="w-full p-2 pb-0">
      <View
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          setCardWidth(width);
        }}>
        <UpcomingFixtureCard />
      </View>

      {/* Render remaining cards normally */}
      <UpcomingFixtureCard />
      <UpcomingFixtureCard />
      <UpcomingFixtureCard />
      <UpcomingFixtureCard />
      <UpcomingFixtureCard />
      <UpcomingFixtureCard />
      <UpcomingFixtureCard />
      <UpcomingFixtureCard />
    </ScrollView>
  );
};

export default HorizontalScrollUpcomingFixtures;
