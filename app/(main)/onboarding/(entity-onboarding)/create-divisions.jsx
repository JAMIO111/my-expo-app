import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import CustomTextInput from '@components/CustomTextInput';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@contexts/ThemeProvider';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';

// SwipeableCard (Keeping your existing logic)
const SwipeableCard = ({ item, onDelete, children }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const height = useSharedValue(1);

  const DELETE_THRESHOLD = -240;
  const REVEAL_THRESHOLD = -60;

  // Create a reset function that can be called from JavaScript
  const resetPosition = () => {
    translateX.value = withSpring(0);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      const newTranslateX = context.startX + event.translationX;
      // Only allow left swipe (negative values) and limit the swipe distance
      translateX.value = Math.min(0, Math.max(newTranslateX, -250));
    },
    onEnd: (event) => {
      const shouldShowDialog = translateX.value < DELETE_THRESHOLD;

      if (shouldShowDialog) {
        // Show confirmation dialog instead of immediately deleting
        translateX.value = withSpring(-80); // Snap to show delete button
        runOnJS(onDelete)(item.tempId, resetPosition);
      } else if (translateX.value < REVEAL_THRESHOLD) {
        // Snap to show delete button
        translateX.value = withSpring(-80);
      } else {
        // Snap back to original position
        translateX.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      height: height.value === 1 ? undefined : height.value,
      overflow: 'hidden',
    };
  });

  const deleteBackgroundStyle = useAnimatedStyle(() => {
    // Clamp translateX to max swipe
    const clampedX = Math.max(translateX.value, -80);

    const deleteOpacity = interpolate(clampedX, [-80, 0], [1, 0], 'clamp');
    const scale = interpolate(clampedX, [-80, 0], [1, 0.8], 'clamp');

    return {
      opacity: deleteOpacity,
      transform: [{ scale }],
    };
  });

  const handleDeletePress = () => {
    // Show confirmation dialog and pass reset function
    runOnJS(onDelete)(item.tempId, resetPosition);
  };

  return (
    <Animated.View style={containerStyle}>
      <View className="relative mb-3">
        {/* Delete background - positioned absolutely */}
        <Animated.View
          style={deleteBackgroundStyle}
          className="absolute bottom-0 right-0 top-0 z-0 w-20 items-center justify-center rounded-2xl bg-theme-red">
          <Pressable
            onPress={handleDeletePress}
            className="h-full w-full items-center justify-center">
            <Ionicons name="trash-outline" size={24} color="white" />
            <Text className="font-saira-medium text-white">Delete</Text>
          </Pressable>
        </Animated.View>

        {/* Swipeable card */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={cardStyle} className="z-10">
            {children}
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Animated.View>
  );
};

export default function CreateDivisions() {
  useOnboardingStep(3, 4);
  const router = useRouter();
  const { districtId, districtName, privateDistrict } = useLocalSearchParams();
  const bottomSheetRef = useRef(null);
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();

  // --- STATE ---
  const [groups, setGroups] = useState([]); // [{id: 1, name: 'Main', type: 'team'}]
  const [divisions, setDivisions] = useState([]);
  const [sheetMode, setSheetMode] = useState('GROUP'); // 'GROUP' or 'DIVISION'

  // Group Form
  const [gName, setGName] = useState('');
  const [compType, setCompType] = useState('team'); // 'individual' or 'team'

  // Division Form
  const [dName, setDName] = useState('');
  const [tier, setTier] = useState('1');
  const [promo, setPromo] = useState('0');
  const [releg, setReleg] = useState('0');
  const [maxComps, setMaxComps] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [editingDivisionId, setEditingDivisionId] = useState(null);

  const closeSheet = () => {
    editingDivisionId ? setEditingDivisionId(null) : null;
    setGName('');
    setDName('');
    setTier('1');
    setPromo('0');
    setReleg('0');
    setMaxComps(null);
    bottomSheetRef.current?.close();
  };

  useEffect(() => {
    if (selectedGroupId) {
      setTier(nextTier.toString());
    }
  }, [selectedGroupId, nextTier]);

  // --- LOGIC ---
  const handleAddGroup = () => {
    if (!gName) return Alert.alert('Error', 'Enter a group name');
    if (groups.some((g) => g.name.trim().toLowerCase() === gName.trim().toLowerCase())) {
      return Alert.alert('Error', 'A group with that name already exists');
    }
    const newGroup = {
      id: groups.reduce((max, g) => Math.max(max, g.id), 0) + 1,
      name: gName.trim(),
      type: compType,
    };
    setGroups([...groups, newGroup]);
    setGName('');
    closeSheet();
  };

  const handleDeleteGroup = (id) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setDivisions((prev) => prev.filter((d) => d.groupId !== id));
  };

  const isTopTier = useMemo(() => {
    const groupDivisions = divisions.filter((d) => d.groupId === selectedGroupId);
    if (groupDivisions.length === 0) return false;
    const minTier = Math.min(...groupDivisions.map((d) => d.tier));
    return Number(tier) === minTier;
  }, [tier, selectedGroupId, divisions]);

  const handleSaveDivision = () => {
    if (!selectedGroupId) return Alert.alert('Missing Info', 'Select a group for the division');
    if (!dName.trim()) return Alert.alert('Missing Info', 'Enter a division name');
    if (
      divisions.some(
        (d) =>
          d.tempId !== editingDivisionId &&
          d.name.trim().toLowerCase() === dName.trim().toLowerCase()
      )
    ) {
      return Alert.alert('Duplicate Name', 'Every division in the league needs its own name.');
    }
    if (maxComps !== null && maxComps !== '' && Number(maxComps) < 2) {
      return Alert.alert('Invalid Limit', 'A division needs room for at least 2 entrants.');
    }

    setDivisions((prev) => {
      let updated;

      if (editingDivisionId) {
        // Editing existing division
        updated = prev.map((d) =>
          d.tempId === editingDivisionId
            ? {
                ...d,
                name: dName.trim(),
                tier: Number(tier),
                promotionSpots: Number(tier) === 1 ? 0 : Number(promo),
                relegationSpots: Number(releg),
                maxCompetitors: maxComps !== null && maxComps !== '' ? Number(maxComps) : null,
              }
            : d
        );
      } else {
        // Adding new division
        const newDiv = {
          tempId: Date.now().toString(),
          groupId: selectedGroupId,
          groupName: groups.find((g) => g.id === selectedGroupId)?.name || '',
          competitorType: groups.find((g) => g.id === selectedGroupId)?.type || 'team',
          name: dName.trim(),
          tier: Number(tier),
          promotionSpots: Number(tier) === 1 ? 0 : Number(promo),
          relegationSpots: Number(releg),
          maxCompetitors: maxComps !== null && maxComps !== '' ? Number(maxComps) : null,
        };
        updated = [...prev, newDiv];
      }

      // Reorder tiers for the group to avoid duplicates/gaps
      const groupDivs = updated
        .filter((d) => d.groupId === selectedGroupId)
        .sort((a, b) => a.tier - b.tier)
        .map((d, index) => ({ ...d, tier: index + 1 })); // ✅ create new objects

      // Merge back with divisions from other groups
      const otherDivs = updated.filter((d) => d.groupId !== selectedGroupId);
      return [...otherDivs, ...groupDivs];
    });

    // Reset form
    setEditingDivisionId(null);
    setDName('');
    setTier(nextTier.toString());
    setPromo('0');
    setReleg('0');
    setMaxComps(null);
    closeSheet();
  };

  const handleEditDivision = (div) => {
    setEditingDivisionId(div.tempId);
    setSelectedGroupId(div.groupId);
    setDName(div.name);
    setTier(div.tier.toString());
    setPromo(div.promotionSpots.toString());
    setReleg(div.relegationSpots.toString());
    setMaxComps(div.maxCompetitors !== null ? div.maxCompetitors.toString() : null);
    setSheetMode('DIVISION');
    bottomSheetRef.current?.expand();
  };

  const handleDeleteDivision = (id) => {
    setDivisions((prev) => {
      // Remove the division
      const updated = prev.filter((d) => d.tempId !== id);

      // Find the group of the deleted division
      const deletedGroupId = prev.find((d) => d.tempId === id)?.groupId;

      if (!deletedGroupId) return updated;

      // Reorder tiers only for that group
      const groupDivs = updated
        .filter((d) => d.groupId === deletedGroupId)
        .sort((a, b) => a.tier - b.tier)
        .map((d, index) => ({
          ...d,
          tier: index + 1, // assign sequential tiers
        }));

      // Merge back with divisions from other groups
      const otherDivs = updated.filter((d) => d.groupId !== deletedGroupId);

      return [...otherDivs, ...groupDivs];
    });

    // Optional: update nextTier for the selected group
    if (selectedGroupId === null) return;

    const groupDivisions = divisions
      .filter((d) => d.groupId === selectedGroupId && d.tempId !== id)
      .map((d) => d.tier);

    const next = groupDivisions.length > 0 ? Math.max(...groupDivisions) + 1 : 1;
    setTier(next.toString());
  };

  const handleSave = () => {
    if (divisions.length === 0) {
      Alert.alert(
        'Add a Division',
        'Your league needs at least one division before teams can join it.'
      );
      return;
    }

    const payload = divisions.map(({ tempId, ...rest }) => rest);

    const warnings = [];

    groups.forEach((group) => {
      // Get divisions for this group and sort by tier
      const groupDivs = divisions
        .filter((d) => d.groupId === group.id)
        .sort((a, b) => a.tier - b.tier);

      if (groupDivs.length === 0) return; // skip empty groups

      // Top tier promotions must be 0
      if (groupDivs[0].promotionSpots !== 0) {
        warnings.push(`Group "${group.name}": Top tier promotions must be 0.`);
      }

      // Bottom tier relegations must be 0
      if (groupDivs[groupDivs.length - 1].relegationSpots !== 0) {
        warnings.push(`Group "${group.name}": Bottom tier relegations must be 0.`);
      }

      // Intermediate tiers mismatch check
      for (let i = 0; i < groupDivs.length - 1; i++) {
        const current = groupDivs[i];
        const next = groupDivs[i + 1];
        if (current.relegationSpots !== next.promotionSpots) {
          warnings.push(
            `Group "${group.name}": ${current.name} relegations (${current.relegationSpots}) do not match ${next.name} promotions (${next.promotionSpots})`
          );
        }
      }
    });

    if (warnings.length > 0) {
      Alert.alert('Warning', warnings.join('\n'), [
        { text: "Okay, I'll fix it.", style: 'destructive' },
        {
          text: 'Continue anyway',
          onPress: () =>
            router.push({
              pathname: '/(main)/onboarding/(entity-onboarding)/create-season',
              params: {
                divisions: JSON.stringify(payload),
                groups: JSON.stringify(groups),
                districtId,
                districtName,
                privateDistrict,
              },
            }),
        },
      ]);
      return;
    }

    // All checks pass
    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/create-season',
      params: {
        divisions: JSON.stringify(payload),
        groups: JSON.stringify(groups),
        districtId,
        districtName,
        privateDistrict,
      },
    });
  };

  const nextTier = useMemo(() => {
    const groupDivisions = divisions.filter((d) => d.groupId === selectedGroupId);
    if (groupDivisions.length === 0) return 1;
    const maxTier = Math.max(...groupDivisions.map((d) => d.tier));
    return maxTier + 1;
  }, [selectedGroupId, divisions]);

  const updateNextTier = (groupId) => {
    if (!groupId) return setTier('1');

    const groupDivisions = divisions.filter((d) => d.groupId === groupId).map((d) => d.tier);

    if (groupDivisions.length === 0) {
      setTier('1');
    } else {
      const maxTier = Math.max(...groupDivisions);
      setTier((maxTier + 1).toString());
    }
  };

  console.log('Groups:', groups);
  console.log('Divisions:', divisions);

  return (
    <>
      <View className="flex-1 bg-brand">
        <View className="px-6 pb-5 pt-3">
          <Text style={{ lineHeight: 42 }} className="font-delagothic text-4xl text-text-on-brand">
            Structure your league
          </Text>
          <Text className="mt-3 font-tektur text-lg leading-6 text-text-on-brand-2">
            Groups are ladders of divisions linked by promotion and relegation, for example Monday
            Teams or Thursday Singles. You're defining the structure here, not creating
            competitions.
          </Text>
        </View>

        <View className="flex-1 rounded-t-[32px] bg-brand-dark px-5 pt-5">
          <View className="mb-5 flex-row gap-3">
            <View className="flex-1">
              <CTAButton
                text="New group"
                type="yellow"
                icon={<Ionicons name="duplicate-outline" size={20} color={themeColors.text} />}
                callbackFn={() => {
                  setSheetMode('GROUP');
                  bottomSheetRef.current?.expand();
                }}
                borderRadius={14}
              />
            </View>
            {groups.length > 0 && (
              <View className="flex-1">
                <CTAButton
                  text="Add division"
                  type="white"
                  icon={<Ionicons name="add" size={20} color={themeColors.text} />}
                  callbackFn={() => {
                    setSheetMode('DIVISION');
                    updateNextTier(selectedGroupId);
                    bottomSheetRef.current?.expand();
                  }}
                  borderRadius={14}
                />
              </View>
            )}
          </View>

          {groups.length === 0 && (
            <View className="items-center gap-3 rounded-3xl border-2 border-dashed border-white/20 p-8">
              <Ionicons name="layers-outline" size={36} color="#FFFFFF88" />
              <Text className="text-center font-saira text-lg text-text-on-brand-2">
                Start by creating a group, then add your divisions to it.
              </Text>
            </View>
          )}

          <FlatList
            showsVerticalScrollIndicator={false}
            data={groups}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item: group }) => (
              <View className="mb-8">
                <View className="mb-3 flex-row items-baseline justify-between border-b border-white/20 pb-1">
                  <Text className="font-saira-semibold text-lg uppercase text-theme-yellow">
                    {group.name}{' '}
                    <Text className="text-sm text-text-on-brand-2">({group.type})</Text>
                  </Text>
                  <Pressable
                    onPress={() => {
                      handleDeleteGroup(group.id);
                    }}
                    className="flex-row items-center gap-2 rounded-lg bg-theme-red px-1 py-0.5">
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    <Text className="font-saira text-white">Delete Group</Text>
                  </Pressable>
                </View>

                {divisions
                  .filter((d) => d.groupId === group.id)
                  .map((div) => (
                    <SwipeableCard key={div.tempId} item={div} onDelete={handleDeleteDivision}>
                      <Pressable
                        onPress={() => handleEditDivision(div)}
                        className="flex-row items-center justify-between rounded-2xl bg-bg-grouped-2 px-5 py-3">
                        <View>
                          <Text className="font-saira-semibold text-xl text-text-1">
                            {div.name}
                          </Text>
                          <Text className="text-md font-saira-medium text-text-2">
                            Tier {div.tier}
                          </Text>
                        </View>
                        <View className="flex-row gap-4">
                          <View className="items-center gap-1">
                            <Ionicons name="caret-up" size={20} color="green" />
                            <Text className="font-saira-medium text-xl text-text-1">
                              {div.promotionSpots}
                            </Text>
                          </View>
                          <View className="items-center gap-1">
                            <Ionicons name="caret-down" size={20} color="red" />
                            <Text className="font-saira-medium text-xl text-text-1">
                              {div.relegationSpots}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </SwipeableCard>
                  ))}
              </View>
            )}
          />
          {divisions.length > 0 && (
            <View className="pb-8 pt-3">
              <CTAButton text="Save & continue" type="yellow" callbackFn={handleSave} />
            </View>
          )}
        </View>

        <BottomSheetWrapper
          ref={bottomSheetRef}
          initialIndex={-1}
          snapPoints={['88%']}
          marginTop={0}
          backgroundColor={themeColors.brandNormal}
          indicatorColor="themeGray3"
          footerComponent={(props) => (
            <BottomSheetFooter {...props}>
              <View
                style={{ paddingBottom: insets.bottom }}
                className="w-full gap-3 bg-brand px-6 pt-4">
                <CTAButton
                  text={
                    sheetMode === 'GROUP'
                      ? 'Create group'
                      : editingDivisionId
                        ? 'Save changes'
                        : 'Add division'
                  }
                  type="yellow"
                  callbackFn={sheetMode === 'GROUP' ? handleAddGroup : handleSaveDivision}
                />
              </View>
            </BottomSheetFooter>
          )}>
          <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
            <Text
              style={{ lineHeight: 36 }}
              className="font-delagothic text-3xl text-text-on-brand">
              {sheetMode === 'GROUP'
                ? 'New group'
                : editingDivisionId
                  ? 'Edit division'
                  : 'New division'}
            </Text>
            <Pressable
              hitSlop={10}
              onPress={closeSheet}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="close" size={22} color="white" />
            </Pressable>
          </View>

          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 260, paddingTop: 8, paddingHorizontal: 24 }}>
            {sheetMode === 'GROUP' ? (
              <View className="gap-6">
                <OnboardingInput
                  label="Group name"
                  icon="grid-outline"
                  placeholder="e.g. Thursday Night"
                  value={gName}
                  onChangeText={setGName}
                  autoCapitalize="words"
                  returnKeyType="none"
                />
                <View className="gap-3">
                  <Text className="pl-1 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
                    Who competes in it?
                  </Text>
                  <ChoiceCard
                    icon="people"
                    iconColor="#10B981"
                    title="Teams"
                    subtitle="Groups of two or more players"
                    selected={compType === 'team'}
                    onPress={() => setCompType('team')}
                  />
                  <ChoiceCard
                    icon="person"
                    iconColor="#3B82F6"
                    title="Individuals"
                    subtitle="Solo competitors"
                    selected={compType === 'individual'}
                    onPress={() => setCompType('individual')}
                  />
                  <Text className="px-1 font-saira text-sm leading-5 text-text-on-brand-2">
                    This decides who can join competitions in the group and how they appear in the
                    app, so check it's right.
                  </Text>
                </View>
              </View>
            ) : (
              <View className="gap-6">
                <View className="gap-3">
                  <Text className="pl-1 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
                    Group
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {groups.map((g) => {
                      const active = selectedGroupId === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          onPress={() => setSelectedGroupId(g.id)}
                          className={`rounded-full border-2 px-5 py-2 ${
                            active ? 'border-white bg-white' : 'border-white/20 bg-white/10'
                          }`}>
                          <Text
                            className={`font-saira-medium text-lg ${active ? 'text-black' : 'text-text-on-brand'}`}>
                            {g.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <OnboardingInput
                  label="Division name"
                  icon="trophy-outline"
                  placeholder="e.g. Super League"
                  value={dName}
                  onChangeText={setDName}
                  autoCapitalize="words"
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <OnboardingInput
                      label="Tier"
                      icon="medal-outline"
                      value={tier}
                      editable={false}
                    />
                  </View>
                  <View className="flex-1">
                    <OnboardingInput
                      label="Promoted"
                      icon="caret-up-outline"
                      value={isTopTier ? '0' : promo}
                      onChangeText={(t) => setPromo(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      editable={!isTopTier}
                      maxLength={2}
                    />
                  </View>
                  <View className="flex-1">
                    <OnboardingInput
                      label="Relegated"
                      icon="caret-down-outline"
                      value={releg}
                      onChangeText={(t) => setReleg(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>

                <OnboardingInput
                  label="Max entrants (optional)"
                  icon="people-outline"
                  placeholder="No limit"
                  value={maxComps ?? ''}
                  onChangeText={(t) => setMaxComps(t.replace(/[^0-9]/g, '') || null)}
                  keyboardType="number-pad"
                  editable={!isTopTier}
                  maxLength={3}
                  hint={`Limits how many ${
                    groups.find((g) => g.id === selectedGroupId)?.type === 'individual'
                      ? 'players'
                      : 'teams'
                  } can join this division. Leave blank for unlimited.`}
                />
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheetWrapper>
      </View>
    </>
  );
}
