import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors';
import { useColorScheme } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import CustomMultiSelect from '../../../components/CustomMultiSelect';
import { StatusBar } from 'expo-status-bar';

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
  const router = useRouter();
  const { districtId, districtName, privateDistrict } = useLocalSearchParams();
  const bottomSheetRef = useRef(null);
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light;

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
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [editingDivisionId, setEditingDivisionId] = useState(null);

  const closeSheet = () => {
    editingDivisionId ? setEditingDivisionId(null) : null;
    setGName('');
    setDName('');
    setTier('1');
    setPromo('0');
    setReleg('0');
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
    const newGroup = {
      id: groups.length + 1,
      name: gName,
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
    if (!dName) return Alert.alert('Missing Info', 'Enter a division name');

    setDivisions((prev) => {
      let updated;

      if (editingDivisionId) {
        // Editing existing division
        updated = prev.map((d) =>
          d.tempId === editingDivisionId
            ? {
                ...d,
                name: dName,
                tier: Number(tier),
                promotionSpots: Number(tier) === 1 ? 0 : Number(promo),
                relegationSpots: Number(releg),
              }
            : d
        );
      } else {
        // Adding new division
        const newDiv = {
          tempId: Date.now().toString(),
          groupId: selectedGroupId,
          groupName: groups.find((g) => g.id === selectedGroupId)?.name || '',
          name: dName,
          tier: Number(tier),
          promotionSpots: Number(tier) === 1 ? 0 : Number(promo),
          relegationSpots: Number(releg),
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
    closeSheet();
  };

  const handleEditDivision = (div) => {
    setEditingDivisionId(div.tempId);
    setSelectedGroupId(div.groupId);
    setDName(div.name);
    setTier(div.tier.toString());
    setPromo(div.promotionSpots.toString());
    setReleg(div.relegationSpots.toString());

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
      .filter((d) => d.groupId === selectedGroupId && d.id !== id)
      .map((d) => d.tier);

    const next = groupDivisions.length > 0 ? Math.max(...groupDivisions) + 1 : 1;
    setTier(next.toString());
  };

  const handleSave = () => {
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
      <Stack.Screen options={{ title: 'Step 3 of 4' }} />
      <StatusBar style="light" />
      <View className="flex-1 bg-brand px-4">
        <StepPillGroup steps={4} currentStep={3} />

        <View className="my-6">
          <Text className="pb-2 font-delagothic text-2xl text-text-on-brand">
            Structure your league.
          </Text>
          <Text className="pb-4 font-saira text-sm text-text-on-brand-2">
            A group is a collection of divisions that promote/relegate to each other as a ladder.
            Only create new group if division is unrelated to the existing one (e.g. Monday Teams,
            and Thursday Singles) You are not creating competitions at this point - just the
            structure.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <CTAButton
                text="NEW GROUP"
                type="yellow"
                icon={<Ionicons name="duplicate-outline" size={20} color={themeColors.text} />}
                callbackFn={() => {
                  setSheetMode('GROUP');
                  bottomSheetRef.current?.expand();
                }}
                borderRadius={12}
              />
            </View>

            {groups.length > 0 && (
              <View className="flex-1">
                <CTAButton
                  text="ADD DIVISION"
                  type="white"
                  icon={<Ionicons name="add" size={20} color={themeColors.text} />}
                  callbackFn={() => {
                    setSheetMode('DIVISION');
                    updateNextTier(selectedGroupId);
                    bottomSheetRef.current?.expand();
                  }}
                  borderRadius={12}
                />
              </View>
            )}
          </View>
        </View>

        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: group }) => (
            <View className="mb-8">
              <View className="mb-3 flex-row items-baseline justify-between border-b border-white/20 pb-1">
                <Text className="font-saira-semibold text-lg uppercase text-theme-yellow">
                  {group.name} <Text className="text-sm text-text-on-brand-2">({group.type})</Text>
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
          <View className="px-2 py-8">
            <CTAButton text="Save & Continue" type="yellow" callbackFn={handleSave} />
          </View>
        )}

        <BottomSheetWrapper
          ref={bottomSheetRef}
          initialIndex={-1}
          snapPoints={['90%']}
          footerComponent={(props) => (
            <BottomSheetFooter {...props}>
              <View
                style={{ paddingBottom: 80 }}
                className="w-full rounded-t-3xl bg-bg-grouped-3 p-6">
                <CTAButton
                  text={
                    sheetMode === 'GROUP'
                      ? 'Create Group'
                      : editingDivisionId
                        ? 'Save Changes'
                        : 'Add Division'
                  }
                  type="brand"
                  callbackFn={sheetMode === 'GROUP' ? handleAddGroup : handleSaveDivision}
                />
              </View>
            </BottomSheetFooter>
          )}>
          {/* Fixed Header */}
          <BottomSheetView
            style={{
              paddingHorizontal: 32,
              paddingTop: 8,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#ccc',
              backgroundColor: themeColors.bgGrouped2,
              zIndex: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ lineHeight: 40 }} className="font-saira-medium text-3xl text-text-1">
              {sheetMode === 'GROUP' ? 'Create New Group' : 'Add New Division'}
            </Text>
            <Pressable className="p-2" onPress={closeSheet}>
              <Ionicons name="close" size={24} color={themeColors.primaryText} />
            </Pressable>
          </BottomSheetView>

          <BottomSheetScrollView
            contentContainerStyle={{
              paddingBottom: 600,
              paddingTop: 80,
              paddingHorizontal: 24,
            }}>
            {sheetMode === 'GROUP' ? (
              <View className="flex-1 gap-4">
                <CustomTextInput
                  title="Group Name"
                  titleColor="text-text-1"
                  value={gName}
                  leftIconName="grid-outline"
                  iconColor="#6B46C1" //purple
                  onChangeText={setGName}
                  placeholder="e.g. Thursday Night"
                  autoCapitalize="words"
                />
                <View className="flex gap-2">
                  <Text className="mt-2 pl-2 font-saira-medium text-xl text-text-1">
                    Competitor Type
                  </Text>
                  <View className="flex-row gap-2">
                    {['individual', 'team'].map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => setCompType(t)}
                        className={`flex-1 items-center rounded-xl p-3 ${compType === t ? 'bg-theme-purple' : 'bg-gray-200'}`}>
                        <Text
                          className={`font-saira-medium text-lg ${compType === t ? 'text-white' : 'text-black'}`}>
                          {t.slice(0, 1).toUpperCase() + t.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text className="px-1 pt-2 text-sm text-text-2">
                    Individual groups are for solo competitors, while team groups are for groups of
                    2 or more. Please ensure this is correct as it will dictate who can join certain
                    competitions and how they are displayed in the app.
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex-1 gap-2">
                <CustomMultiSelect
                  options={groups.map((g) => ({ label: g.name, value: g.id }))}
                  selectedValues={selectedGroupId ? [selectedGroupId] : []}
                  onValueChange={(vals) => setSelectedGroupId(vals[0])}
                  title="Group"
                  placeholder="Select a group for this division"
                  leftIconName="grid-outline"
                  iconColor="#6B46C1"
                  titleColor="text-text-1"
                  multiSelect={false}
                />
                <CustomTextInput
                  value={dName}
                  onChangeText={setDName}
                  title="Division Name"
                  placeholder="e.g. Super League"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="trophy-outline"
                  iconColor="#A259FF"
                  autoCapitalize="words"
                  titleColor="text-text-1"
                />
                <View className="mt-4 flex-row gap-3">
                  <View className="flex-1">
                    <CustomTextInput
                      value={tier}
                      onChangeText={setTier}
                      keyboardType="numeric"
                      editable={false}
                      className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 pb-2 text-xl"
                      title="Tier"
                      placeholder="e.g. 1"
                      leftIconName="medal-outline"
                      iconColor="#D7AF31"
                      titleColor="text-text-1"
                      clearButtonMode="never"
                    />
                  </View>
                  <View className="flex-1">
                    <CustomTextInput
                      title="Promotions"
                      value={isTopTier ? '0' : promo}
                      onChangeText={setPromo}
                      keyboardType="numeric"
                      titleColor="text-text-1"
                      placeholder="e.g. 3"
                      leftIconName="caret-up-outline"
                      iconColor="#34C757"
                      editable={!isTopTier}
                      clearButtonMode="never"
                    />
                  </View>
                  <View className="flex-1">
                    <CustomTextInput
                      value={releg}
                      onChangeText={setReleg}
                      title="Relegations"
                      placeholder="e.g. 3"
                      iconColor="#FF3B30"
                      leftIconName="caret-down-outline"
                      titleColor="text-text-1"
                      keyboardType="numeric"
                      clearButtonMode="never"
                    />
                  </View>
                </View>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheetWrapper>
      </View>
    </>
  );
}
