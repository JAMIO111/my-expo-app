import { useState } from 'react';
import { ScrollView, Dimensions, View, Text, Image } from 'react-native';
import { badgeIcons } from '@lib/badgeIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

const BadgeTierScrollView = ({ selectedBadge, currentValue = 16 }) => {
  const [cardWidth, setCardWidth] = useState(screenWidth * 0.5); // fallback width

  if (!selectedBadge) return null;

  const data = Array.isArray(selectedBadge.meta_data) ? selectedBadge.meta_data : [];

  const getProgressForEntry = (entry) => {
    const unlockedTier = selectedBadge.unlocked_tier;
    const progressValue = currentValue;
    const requirementValue = entry?.requirement?.value ?? 1;

    if (entry.tier <= unlockedTier) return 1;
    if (entry.tier === unlockedTier + 1) return Math.min(progressValue / requirementValue, 1);
    return 0;
  };

  const XpBadge = ({ xp = 350 }) => {
    return (
      <View
        style={{ height: 52, width: 52, transform: [{ rotate: '-20deg' }] }}
        className="relative items-center justify-center">
        <Ionicons
          name="star"
          size={52}
          color="#facc15"
          style={{ position: 'absolute', opacity: 0.55 }}
        />
        <Ionicons
          name="star"
          size={52}
          color="#fde047"
          style={{ position: 'absolute', transform: [{ rotate: '24deg' }], opacity: 0.8 }}
        />
        <Ionicons
          name="star"
          size={52}
          color="#fde047"
          style={{ position: 'absolute', transform: [{ rotate: '48deg' }], opacity: 0.8 }}
        />
        <View style={{ transform: [{ rotate: '20deg' }] }}>
          <Text className="font-saira-bold text-[10px] text-text-1">+{xp}</Text>
          <Text className="font-saira-bold text-[7px] text-text-1" style={{ textAlign: 'center' }}>
            XP
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ width: '100%' }}>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 14 }}>
        {data.map((entry, index) => {
          const isUnlocked =
            typeof entry?.tier === 'number' &&
            typeof selectedBadge?.unlocked_tier === 'number' &&
            entry.tier <= selectedBadge.unlocked_tier;
          const currentTier = entry?.tier === selectedBadge.unlocked_tier + 1;
          const isLocked = entry.tier > selectedBadge?.unlocked_tier + 1;
          const iconKey = entry?.icon;
          const icon = iconKey && badgeIcons?.[iconKey];
          const source = isUnlocked && icon ? icon : require('@assets/LockedBadge.png');
          const progress = getProgressForEntry(entry);

          return (
            <View
              key={index}
              className={`overflow-hidden rounded-3xl ${
                currentTier
                  ? 'border-2 border-theme-green bg-bg-2 shadow-md shadow-black/10'
                  : isUnlocked
                    ? 'border border-theme-green/40 bg-bg-1'
                    : 'border border-theme-gray-4 bg-bg-1 opacity-70'
              }`}>
              <View className="relative">
                {isUnlocked && (
                  <View className="absolute right-3 top-3 z-10">
                    <XpBadge xp={entry?.xp_reward} />
                  </View>
                )}

                <View
                  onLayout={
                    index === 0 ? (e) => setCardWidth(e.nativeEvent.layout.width) : undefined
                  }
                  className="flex-row items-center gap-3 p-4">
                  <View
                    className={`items-center justify-center rounded-2xl ${
                      isUnlocked ? 'bg-theme-green/10' : 'bg-theme-gray-4/30'
                    }`}
                    style={{ width: cardWidth * 0.28, height: cardWidth * 0.28 }}>
                    <Image
                      source={source}
                      style={{ width: cardWidth * 0.22, height: cardWidth * 0.22 }}
                      resizeMode="contain"
                    />
                  </View>

                  <View className="flex-1 items-start gap-1">
                    <View className="mb-1 flex-row items-center gap-2">
                      <View
                        className={`rounded-full px-3 py-1 ${
                          isUnlocked ? 'bg-theme-green/15' : 'bg-theme-gray-4/40'
                        }`}>
                        <Text
                          className={`font-saira-bold text-sm ${
                            isUnlocked ? 'text-theme-green' : 'text-text-3'
                          }`}>
                          TIER {entry?.tier ?? '–'}
                        </Text>
                      </View>
                      {isUnlocked && !currentTier && (
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                      )}
                    </View>

                    <Text className="text-left font-saira-semibold text-lg text-text-1">
                      {entry?.title ?? 'Unnamed Tier'}
                    </Text>

                    <Text
                      className="text-left font-saira-medium leading-5 text-text-2"
                      numberOfLines={2}>
                      {isLocked
                        ? `Unlock tier ${entry?.tier - 1} to view requirements.`
                        : entry?.description}
                    </Text>

                    {!isLocked && (
                      <Text className="mt-0.5 text-left font-saira text-sm text-text-2">
                        {Math.min(entry?.requirement?.value, currentValue)} /{' '}
                        {entry?.requirement?.value} achieved
                      </Text>
                    )}
                  </View>
                </View>

                {currentTier && (
                  <View className="px-4 pb-4">
                    <View className="h-2.5 w-full overflow-hidden rounded-full bg-theme-gray-4/50">
                      <View
                        className="h-full rounded-full bg-theme-green"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </View>
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
