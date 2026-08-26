import { useState } from 'react';
import { ScrollView, Dimensions, View, Text, Image } from 'react-native';
import { badgeIcons } from '@lib/badgeIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

const formatConditionLabel = (condition) => {
  if (condition?.type === 'ratio') {
    return 'Win Rate';
  }
  return (condition?.stat ?? '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatConditionValue = (condition, value) => {
  return condition?.type === 'ratio' ? `${value}%` : `${value}`;
};

const BadgeTierScrollView = ({ selectedBadge }) => {
  const [cardWidth, setCardWidth] = useState(screenWidth * 0.5);

  if (!selectedBadge) return null;

  const data = Array.isArray(selectedBadge.tiers) ? selectedBadge.tiers : [];

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

  // Overall progress fraction for a tier's bar: the weakest of its conditions,
  // since a tier with multiple AND'd conditions is only as complete as its
  // furthest-behind requirement.
  const getProgressFraction = (entry) => {
    const conditions = entry?.progress?.conditions ?? [];
    if (conditions.length === 0) return 0;

    const ratios = conditions.map((condition) => {
      const target = Number(condition.target) || 1;
      const current = Number(condition.current) || 0;
      return Math.min(current / target, 1);
    });

    return Math.min(...ratios);
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

          const progress = getProgressFraction(entry);
          const conditions = entry?.progress?.conditions ?? [];

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

                <View className="gap-2 px-4 pb-3">
                  <View className="flex-row items-center gap-3">
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
                  </View>

                  {!isLocked &&
                    conditions.map((condition, condIndex) => (
                      <View key={condIndex} className="flex-row justify-between">
                        <Text className="font-saira-medium text-xs text-text-3">
                          {formatConditionLabel(condition)}
                        </Text>
                        <Text
                          className={`font-saira-semibold text-sm ${
                            currentTier ? 'text-theme-blue' : 'text-theme-green'
                          }`}>
                          {formatConditionValue(condition, condition.current)} /{' '}
                          {formatConditionValue(condition, condition.target)}
                        </Text>
                      </View>
                    ))}
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
