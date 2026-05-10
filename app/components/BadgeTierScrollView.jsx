import { useState } from 'react';
import { ScrollView, Dimensions, View, Text, Image } from 'react-native';
import { badgeIcons } from '@lib/badgeIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

const BadgeTierScrollView = ({ selectedBadge, currentValue = 16 }) => {
  const [cardWidth, setCardWidth] = useState(screenWidth * 0.5); // fallback width

  if (!selectedBadge) return null;

  const data = Array.isArray(selectedBadge.meta_data) ? selectedBadge.meta_data : [];

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

  const XpBadge = ({ xp = 350 }) => {
    return (
      <View
        style={{ height: 60, width: 60, transform: [{ rotate: '-20deg' }] }}
        className="relative items-center justify-center">
        <Ionicons
          name="star"
          size={60}
          color="#facc15"
          style={{
            position: 'absolute',
            opacity: 0.65,
          }}
        />

        <Ionicons
          name="star"
          size={60}
          color="#fde047"
          style={{
            position: 'absolute',
            transform: [{ rotate: '24deg' }],
            opacity: 0.85,
          }}
        />

        <Ionicons
          name="star"
          size={60}
          color="#fde047"
          style={{
            position: 'absolute',
            transform: [{ rotate: '48deg' }],
            opacity: 0.85,
          }}
        />

        <View className="rounded-fullpx-1.5 py-[1px]">
          <Text className="font-saira-bold text-[10px] text-text-1">+{xp} XP</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ width: '100%' }}>
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 120, gap: 16 }}>
        {data.map((entry, index) => {
          const isUnlocked =
            typeof entry?.tier === 'number' &&
            typeof selectedBadge?.unlocked_tier === 'number' &&
            entry.tier <= selectedBadge.unlocked_tier;
          const currentTier = entry?.tier === selectedBadge.unlocked_tier + 1;
          const iconKey = entry?.icon;
          const icon = iconKey && badgeIcons?.[iconKey];
          const source = isUnlocked && icon ? icon : require('@assets/LockedBadge.png');

          return (
            <View
              className={`rounded-3xl ${currentTier ? 'shadow-md' : isUnlocked ? 'border-2 border-theme-green bg-bg-2' : ''}`}
              key={index}>
              <View
                className={`relative w-full overflow-hidden rounded-3xl ${currentTier ? 'bg-bg-2' : ''}`}>
                {isUnlocked && (
                  <View className="absolute right-2 top-2">
                    <XpBadge xp={entry?.xp_reward} />
                  </View>
                )}
                <View
                  onLayout={
                    index === 0 ? (e) => setCardWidth(e.nativeEvent.layout.width) : undefined
                  }
                  className={`flex-row items-center gap-2 p-4 shadow-sm`}>
                  <Image
                    source={source}
                    style={{
                      width: cardWidth * 0.3,
                      height: cardWidth * 0.3,
                    }}
                    resizeMode="contain"
                  />
                  <View className="flex-1 items-start justify-between gap-1">
                    <Text className="px-8 text-left font-saira-semibold text-2xl text-text-2">
                      {entry?.title ?? 'Unnamed Tier'}
                    </Text>
                    <Text className="mt-1 px-8 text-left font-saira-medium text-xl text-text-3">
                      {entry.tier > selectedBadge?.unlocked_tier + 1
                        ? `Unlock tier ${entry?.tier - 1} to view requirements.`
                        : entry?.description}
                    </Text>
                    {entry.tier <= selectedBadge?.unlocked_tier + 1 && (
                      <Text className="mt-1 px-8 text-left font-saira text-base text-text-3">
                        {Math.min(entry?.requirement?.value, currentValue)} /{' '}
                        {entry?.requirement?.value} Achieved
                      </Text>
                    )}
                  </View>
                </View>
                {currentTier && (
                  <View className="mt-2 h-3 w-full overflow-hidden rounded-full bg-theme-gray-4">
                    <View
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${getProgressForEntry(entry) * 100}%` }}
                    />
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default BadgeTierScrollView;
