import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import CustomTextInput from '@components/CustomTextInput';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
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

  // A plain JS closure, so no function has to be passed across threads
  const requestDelete = () => onDelete(item.tempId, resetPosition);
  const startX = useSharedValue(0);

  // Reanimated 4 removed useAnimatedGestureHandler: this is the gesture-handler 2 equivalent.
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      // Only allow a left swipe, and limit the distance
      translateX.value = Math.min(0, Math.max(startX.value + event.translationX, -250));
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        // Ask for confirmation, leaving the delete button showing
        translateX.value = withSpring(-80);
        runOnJS(requestDelete)();
      } else if (translateX.value < REVEAL_THRESHOLD) {
        translateX.value = withSpring(-80);
      } else {
        translateX.value = withSpring(0);
      }
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
    requestDelete();
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
        <GestureDetector gesture={pan}>
          <Animated.View style={cardStyle} className="z-10">
            {children}
          </Animated.View>
        </GestureDetector>
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

  // Group form
  const [gName, setGName] = useState('');
  const [compType, setCompType] = useState('team'); // 'individual' or 'team'

  // Division form
  const [dName, setDName] = useState('');
  const [tier, setTier] = useState('1');
  const [promo, setPromo] = useState('0');
  const [releg, setReleg] = useState('0');
  const [maxComps, setMaxComps] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [editingDivisionId, setEditingDivisionId] = useState(null);

  // --- HELPERS ---
  const divisionsOf = (gid, list = divisions) =>
    list.filter((d) => d.groupId === gid).sort((a, b) => a.tier - b.tier);

  // Keeps a group's ladder consistent: tiers 1..n, the top division promotes nobody, the bottom one
  // relegates nobody, and what one division relegates is what the one below promotes.
  // `editedId` is the division the user just changed, so its numbers win over its neighbours'.
  const normalizeGroup = (list, gid, editedId = null) => {
    const ladder = divisionsOf(gid, list).map((d, i) => ({ ...d, tier: i + 1 }));
    ladder.forEach((d, i) => {
      if (i === 0) d.promotionSpots = 0;
      if (i === ladder.length - 1) d.relegationSpots = 0;
    });
    for (let i = 0; i < ladder.length - 1; i++) {
      if (ladder[i + 1].tempId === editedId) ladder[i].relegationSpots = ladder[i + 1].promotionSpots;
      else ladder[i + 1].promotionSpots = ladder[i].relegationSpots;
    }
    return [...list.filter((d) => d.groupId !== gid), ...ladder];
  };

  const groupType = (gid) => groups.find((g) => g.id === gid)?.type || 'team';

  // Where a new division would sit in the chosen group, and what to pre-fill for it
  const pointNewDivisionAt = (gid) => {
    setSelectedGroupId(gid);
    const ladder = divisionsOf(gid);
    setTier(String(ladder.length + 1));
    setPromo(ladder.length ? String(ladder[ladder.length - 1].relegationSpots ?? 0) : '0');
    setReleg('0');
  };

  const resetForms = () => {
    setEditingDivisionId(null);
    setGName('');
    setCompType('team');
    setDName('');
    setMaxComps(null);
    setReleg('0');
    setPromo('0');
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
    resetForms();
  };

  const openGroupSheet = () => {
    resetForms();
    setSheetMode('GROUP');
    bottomSheetRef.current?.expand();
  };

  const openDivisionSheet = () => {
    resetForms();
    // one group: no need to ask which; several: keep the last used one if it still exists
    const gid = groups.some((g) => g.id === selectedGroupId)
      ? selectedGroupId
      : groups.length === 1
        ? groups[0].id
        : null;
    if (gid) pointNewDivisionAt(gid);
    else {
      setSelectedGroupId(null);
      setTier('1');
    }
    setSheetMode('DIVISION');
    bottomSheetRef.current?.expand();
  };

  // Top of the ladder: nobody to be promoted to. Bottom: nobody to be relegated to.
  const ladderSize = divisionsOf(selectedGroupId).length;
  const tierNumber = Number(tier) || 1;
  const isTopTier = !!selectedGroupId && tierNumber === 1;
  const isBottomTier = !!selectedGroupId && (editingDivisionId ? tierNumber === ladderSize : true);

  // --- LOGIC ---
  const handleAddGroup = () => {
    const name = gName.trim();
    if (!name) return Alert.alert('Missing info', 'Enter a group name');
    if (name.length > 40) return Alert.alert('Name too long', 'Keep the group name to 40 characters.');
    if (groups.some((g) => g.name.trim().toLowerCase() === name.toLowerCase())) {
      return Alert.alert('Already exists', 'A group with that name already exists');
    }
    const newGroup = {
      id: groups.reduce((max, g) => Math.max(max, g.id), 0) + 1,
      name,
      type: compType,
    };
    setGroups([...groups, newGroup]);
    setSelectedGroupId(newGroup.id); // the next division you add goes in the group you just made
    closeSheet();
  };

  const handleDeleteGroup = (id) => {
    const count = divisions.filter((d) => d.groupId === id).length;
    const remove = () => {
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setDivisions((prev) => prev.filter((d) => d.groupId !== id));
      if (selectedGroupId === id) setSelectedGroupId(null);
    };
    if (count === 0) return remove();
    Alert.alert('Delete group?', `This also deletes its ${count} division${count === 1 ? '' : 's'}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  const handleSaveDivision = () => {
    const name = dName.trim();
    const promotions = isTopTier ? 0 : Number(promo) || 0;
    const relegations = isBottomTier ? 0 : Number(releg) || 0;
    const max = maxComps !== null && maxComps !== '' ? Number(maxComps) : null;

    if (!selectedGroupId) return Alert.alert('Missing info', 'Choose a group for the division');
    if (!name) return Alert.alert('Missing info', 'Enter a division name');
    if (name.length > 60) return Alert.alert('Name too long', 'Keep the division name to 60 characters.');
    if (
      divisions.some(
        (d) => d.tempId !== editingDivisionId && d.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return Alert.alert('Duplicate name', 'Every division in the league needs its own name.');
    }
    if (max !== null && max < 2) {
      return Alert.alert('Invalid limit', 'A division needs room for at least 2 entrants.');
    }
    if (max !== null && promotions + relegations > max) {
      return Alert.alert(
        'Too many movements',
        `Promotions (${promotions}) plus relegations (${relegations}) can't be more than the division's ${max} places.`
      );
    }

    setDivisions((prev) => {
      let updated;
      let savedId;

      if (editingDivisionId) {
        savedId = editingDivisionId;
        updated = prev.map((d) =>
          d.tempId === editingDivisionId
            ? { ...d, name, promotionSpots: promotions, relegationSpots: relegations, maxCompetitors: max }
            : d
        );
      } else {
        savedId = Date.now().toString();
        updated = [
          ...prev,
          {
            tempId: savedId,
            groupId: selectedGroupId,
            groupName: groups.find((g) => g.id === selectedGroupId)?.name || '',
            competitorType: groupType(selectedGroupId),
            name,
            tier: divisionsOf(selectedGroupId, prev).length + 1, // new divisions join at the bottom
            promotionSpots: promotions,
            relegationSpots: 0,
            maxCompetitors: max,
          },
        ];
      }
      return normalizeGroup(updated, selectedGroupId, savedId);
    });

    // keep the group selected so several divisions can be added in a row
    const gid = selectedGroupId;
    closeSheet();
    setSelectedGroupId(gid);
  };

  const handleEditDivision = (div) => {
    setEditingDivisionId(div.tempId);
    setSelectedGroupId(div.groupId);
    setDName(div.name);
    setTier(String(div.tier));
    setPromo(String(div.promotionSpots ?? 0));
    setReleg(String(div.relegationSpots ?? 0));
    setMaxComps(div.maxCompetitors !== null && div.maxCompetitors !== undefined ? String(div.maxCompetitors) : null);
    setSheetMode('DIVISION');
    bottomSheetRef.current?.expand();
  };

  const handleDeleteDivision = (id, resetPosition) => {
    const div = divisions.find((d) => d.tempId === id);
    Alert.alert('Delete division?', div ? `Remove ${div.name} from the league structure?` : '', [
      { text: 'Cancel', style: 'cancel', onPress: () => resetPosition?.() },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          setDivisions((prev) => {
            const gid = prev.find((d) => d.tempId === id)?.groupId;
            const rest = prev.filter((d) => d.tempId !== id);
            return gid ? normalizeGroup(rest, gid) : rest;
          }),
      },
    ]);
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

  return (
    <>
      <View className="flex-1 bg-brand">
        <View className="px-6 pb-5 pt-3">
          <Text style={{ lineHeight: 42 }} className="font-delagothic text-4xl text-text-on-brand">
            Structure your league
          </Text>
          <Text className="mt-3 font-tektur text-lg leading-6 text-text-on-brand-2">
            Groups are ladders of divisions linked by promotion and relegation, for example Monday
            Teams or Thursday Singles. You're defining the structure here, not creating competitions.
          </Text>
        </View>

        <View className="flex-1 rounded-t-[32px] bg-brand-dark px-5 pt-5">
        <View className="mb-5 flex-row gap-3">
          <View className="flex-1">
            <CTAButton
              text="New group"
              type="yellow"
              icon={<Ionicons name="duplicate-outline" size={20} color={themeColors.text} />}
              callbackFn={openGroupSheet}
              borderRadius={14}
            />
          </View>
          {groups.length > 0 && (
            <View className="flex-1">
              <CTAButton
                text="Add division"
                type="white"
                icon={<Ionicons name="add" size={20} color={themeColors.text} />}
                callbackFn={openDivisionSheet}
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
                  {group.name} <Text className="text-sm text-text-on-brand-2">({group.type})</Text>
                </Text>
                <Pressable
                  onPress={() => handleDeleteGroup(group.id)}
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
                        <Text className="font-saira-semibold text-xl text-text-1">{div.name}</Text>
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
          marginTop={60}
          keyboardBehavior="fillParent"
          onChange={(index) => {
            if (index === -1) resetForms(); // also when swiped down
          }}
          backgroundColor={themeColors.brandDark}
          indicatorColor="themeGray3"
          footerComponent={(props) => (
            <BottomSheetFooter {...props}>
              <View
                style={{ paddingBottom: insets.bottom + 12 }}
                className="w-full gap-3 border-t border-white/10 bg-brand-dark px-6 pt-4">
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
            <Text style={{ lineHeight: 36 }} className="font-delagothic text-3xl text-text-on-brand">
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
                  returnKeyType="done"
                  onSubmitEditing={handleAddGroup}
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
                          onPress={() => (editingDivisionId ? null : pointNewDivisionAt(g.id))}
                          disabled={!!editingDivisionId}
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

                {!selectedGroupId ? (
                  <Text className="px-1 font-saira text-sm text-amber-200">
                    Choose a group first. The tier and promotion numbers depend on it.
                  </Text>
                ) : (
                  <View className="gap-2">
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <OnboardingInput label="Tier" icon="medal-outline" value={tier} editable={false} />
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
                          value={isBottomTier ? '0' : releg}
                          onChangeText={(t) => setReleg(t.replace(/[^0-9]/g, ''))}
                          keyboardType="number-pad"
                          editable={!isBottomTier}
                          maxLength={2}
                        />
                      </View>
                    </View>
                    <Text className="px-1 font-saira text-sm leading-5 text-text-on-brand-2">
                      {isTopTier
                        ? 'Top of the ladder: nobody can be promoted further.'
                        : `Promoted places are filled by the division above (${divisionsOf(selectedGroupId)[tierNumber - 2]?.name || 'above'}) relegating the same number.`}
                      {isBottomTier
                        ? ' This is the bottom division, so nobody is relegated. Add a division below it to set relegations.'
                        : ''}
                    </Text>
                  </View>
                )}

                <OnboardingInput
                  label="Max entrants (optional)"
                  icon="people-outline"
                  placeholder="No limit"
                  value={maxComps ?? ''}
                  onChangeText={(t) => setMaxComps(t.replace(/[^0-9]/g, '') || null)}
                  keyboardType="number-pad"
                  maxLength={3}
                  hint={`Limits how many ${
                    groupType(selectedGroupId) === 'individual' ? 'players' : 'teams'
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
