import { useState } from 'react';
import { ScrollView, Dimensions, View, Text, Image } from 'react-native';
import { badgeIcons } from '@lib/badgeIcons';

const screenWidth = Dimensions.get('window').width;

const BadgeTierScrollView = ({ selectedBadge, currentValue = 15 }) => {
  const [cardWidth, setCardWidth] = useState(screenWidth * 0.5); // fallback width
  const [scrollX, setScrollX] = useState(0);
  const gap = 0;

  if (!selectedBadge) return null;

  const data = Array.isArray(selectedBadge.meta_data) ? selectedBadge.meta_data : [];

  const initialOffset = screenWidth / 2 - cardWidth / 2 - 53;

  const contentWidth = (cardWidth + gap) * data.length + initialOffset * 2;
  const maxScroll = contentWidth - screenWidth;

  const currentIndex = Math.round(scrollX / (cardWidth + gap));
  const safeIndex = Math.min(Math.max(currentIndex, 0), data.length - 1);

  const currentEntry = data[safeIndex];

  // Helper to calculate progress for each badge
  // We assume `selectedBadge.currentProgress` is your current progress number
  // Adapt if your progress info lives elsewhere
  const getProgressForEntry = (entry) => {
    const unlockedTier = selectedBadge.unlocked_tier;
    const progressValue = currentValue;
    const requirementValue = entry?.requirement?.value ?? 1;

    if (entry.tier <= unlockedTier) {
      // Fully unlocked
      return 1;
    }
    if (entry.tier === unlockedTier + 1) {
      // Partial progress capped at 1
      return Math.min(progressValue / requirementValue, 1);
    }
    // Locked
    return 0;
  };

  const progress = maxScroll > 0 ? Math.min(scrollX / maxScroll, 1) : 0;

  return (
    <View style={{ width: '100%', paddingHorizontal: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{
          paddingHorizontal: initialOffset,
          alignItems: 'center',
        }}
        snapToInterval={cardWidth + gap}
        decelerationRate="fast"
        snapToAlignment="start"
        onScroll={(event) => {
          setScrollX(event.nativeEvent.contentOffset.x);
        }}
        scrollEventThrottle={16}
        className="mb-4 w-full">
        {data.map((entry, index) => {
          const isUnlocked =
            typeof entry?.tier === 'number' &&
            typeof selectedBadge?.unlocked_tier === 'number' &&
            entry.tier <= selectedBadge.unlocked_tier;

          const iconKey = entry?.icon;
          const icon = iconKey && badgeIcons?.[iconKey];
          const source = isUnlocked && icon ? icon : require('@assets/LockedBadge.png');

          return (
            <View
              key={index}
              onLayout={index === 0 ? (e) => setCardWidth(e.nativeEvent.layout.width) : undefined}
              style={{
                width: cardWidth,
                marginRight: index === data.length - 1 ? 0 : gap,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                source={source}
                style={{
                  width: cardWidth * 0.8,
                  height: cardWidth * 0.8,
                }}
                resizeMode="contain"
              />
              <Text className="mt-5 px-8 text-center font-saira-semibold text-2xl text-text-2">
                {entry?.title ?? 'Unnamed Tier'}
              </Text>
              <Text className="mt-1 px-8 text-center font-saira-medium text-xl text-text-3">
                {entry.tier > selectedBadge?.unlocked_tier + 1
                  ? `Unlock tier ${entry?.tier - 1} to view requirements.`
                  : entry?.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Progress bar + requirement text */}
      <View
        style={{
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {/* Target requirement text */}
        <View>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 26,
              color: '#555',
              fontFamily: 'Saira-medium',
            }}>
            {safeIndex >= 0 && currentEntry
              ? currentEntry.tier <= selectedBadge.unlocked_tier
                ? currentEntry.requirement?.value
                : currentValue
              : ''}
          </Text>
        </View>

        {/* Progress bar container */}
        <View
          style={{
            flex: 1,
            height: 12,
            backgroundColor: '#ccc',
            borderRadius: 6,
            overflow: 'hidden',
            marginHorizontal: 12,
          }}>
          {/* Progress bar fill */}
          <View
            style={{
              height: '100%',
              width: `${getProgressForEntry(currentEntry) * 100}%`,
              backgroundColor: '#4f46e5',
              borderRadius: 6,
            }}
          />
        </View>

        <View>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 26,
              color: '#555',
              fontFamily: 'Saira-medium',
            }}>
            {safeIndex >= 0 && currentEntry
              ? currentEntry.tier > selectedBadge.unlocked_tier + 1
                ? '?'
                : currentEntry.requirement?.value
              : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default BadgeTierScrollView;
