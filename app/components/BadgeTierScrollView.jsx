import { useState } from 'react';
import { ScrollView, Dimensions, View, Text, Image } from 'react-native';
import { badgeIcons } from '@lib/badgeIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

const BadgeTierScrollView = ({ selectedBadge, currentValue = 16 }) => {
  const [cardWidth, setCardWidth] = useState(screenWidth * 0.5);

  if (!selectedBadge) return null;

  const data = Array.isArray(selectedBadge.meta_data) ? selectedBadge.meta_data : [];

  const unlockedBadges = Array.isArray(selectedBadge.unlockedBadges)
    ? selectedBadge.unlockedBadges
    : [];

  // Highest tier the player has unlocked
  const unlockedTier =
    unlockedBadges.length > 0
      ? Math.max(...unlockedBadges.map((unlock) => Number(unlock.tier)))
      : 0;

  // Get the unlock record for a particular tier
  const getUnlockedBadge = (tier) => {
    return unlockedBadges.find((unlock) => Number(unlock.tier) === Number(tier));
  };

  const getProgressForEntry = (entry) => {
    const progressValue = currentValue;
    const requirementValue = entry?.requirement?.value ?? 1;

    // Already unlocked
    if (entry.tier <= unlockedTier) {
      return 1;
    }

    // Next tier to unlock
    if (entry.tier === unlockedTier + 1) {
      return Math.min(progressValue / requirementValue, 1);
    }

    // Future tier
    return 0;
  };

  const XpBadge = ({ xp = 350 }) => {
    return (
      <View className="relative items-center justify-center rounded-xl border border-theme-yellow bg-theme-yellow/20 px-2 py-1">
        <Text className="font-saira-bold text-[12px] text-text-1">+{xp} XP</Text>
      </View>
    );
  };

  return (
    <View style={{ width: '100%' }} className="bg-bg-2">
      <ScrollView
        contentContainerStyle={{
          padding: 12,
          paddingBottom: 120,
          gap: 14,
        }}>
        {data.map((entry, index) => {
          const tier = Number(entry?.tier);

          const isUnlocked = tier <= unlockedTier;
          const currentTier = tier === unlockedTier + 1;
          const isLocked = tier > unlockedTier + 1;

          const iconKey = entry?.icon;
          const icon = iconKey && badgeIcons?.[iconKey];

          const source = isUnlocked && icon ? icon : require('@assets/LockedBadge.png');

          const progress = getProgressForEntry(entry);

          // Get the actual unlock record for this tier
          const unlockedBadge = getUnlockedBadge(tier);

          return (
            <View
              key={index}
              className={`rounded-3xl bg-bg-1 ${
                currentTier
                  ? 'border-2 border-theme-blue bg-bg-2 shadow-sm'
                  : isUnlocked
                    ? 'bg-bg-1'
                    : 'opacity-70'
              }`}>
              <View className="relative">
                {isUnlocked && (
                  <View className="absolute right-4 top-4 z-10">
                    <XpBadge xp={entry?.xp} />
                  </View>
                )}

                <View
                  onLayout={
                    index === 0 ? (e) => setCardWidth(e.nativeEvent.layout.width) : undefined
                  }
                  className="flex-row gap-5 p-4">
                  <View className="rounded-xl border border-theme-gray-4 bg-bg-2 p-1 shadow-sm">
                    <View
                      className="items-center justify-center bg-bg-1 shadow-sm"
                      style={{
                        width: cardWidth * 0.25,
                        height: cardWidth * 0.28,
                        borderRadius: 8,
                      }}>
                      <Image
                        source={source}
                        style={{
                          width: cardWidth * 0.2,
                          height: cardWidth * 0.22,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  <View className="flex-1 items-start justify-between py-1">
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`rounded-full px-3 py-1 ${
                          isUnlocked ? 'bg-theme-green/15' : 'bg-theme-gray-4/40'
                        }`}>
                        <Text
                          className={`font-saira-bold text-sm ${
                            isUnlocked ? 'text-theme-green' : 'text-text-3'
                          }`}>
                          TIER {tier || '–'}
                        </Text>
                      </View>

                      {isUnlocked && !currentTier && (
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                      )}
                    </View>

                    <View className="gap-2">
                      <Text className="pt-3 text-left font-saira-semibold text-2xl text-text-1">
                        {entry?.title ?? 'Unnamed Tier'}
                      </Text>

                      <Text
                        className="text-left font-saira-medium leading-5 text-text-2"
                        numberOfLines={2}>
                        {isLocked
                          ? `Unlock tier ${tier - 1} to view requirements.`
                          : entry?.description}
                      </Text>
                    </View>

                    {isUnlocked && unlockedBadge?.unlocked_at && (
                      <Text className="pt-1 font-saira-medium text-xs text-text-3">
                        Unlocked {new Date(unlockedBadge.unlocked_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center gap-3 px-4 pb-2">
                  <View className="h-3 flex-1 overflow-hidden rounded-full bg-theme-gray-4/50 p-[2px]">
                    <View
                      className={`h-full rounded-full ${
                        currentTier ? 'bg-theme-blue' : 'bg-theme-green'
                      }`}
                      style={{
                        width: `${progress * 100}%`,
                      }}
                    />
                  </View>

                  {!isLocked && (
                    <Text
                      className={`text-left font-saira-semibold text-sm ${
                        currentTier ? 'text-theme-blue' : 'text-theme-green'
                      }`}>
                      {Math.min(entry?.requirement?.value ?? 0, currentValue)} /{' '}
                      {entry?.requirement?.value ?? 0}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default BadgeTierScrollView;
