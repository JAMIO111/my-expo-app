import {
  View,
  Text,
  FlatList,
  Pressable,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useState, useRef } from 'react';
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

// SwipeableCard component for individual division cards
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
        runOnJS(onDelete)(item.id, resetPosition);
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
    runOnJS(onDelete)(item.id, resetPosition);
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
            <Text className="mt-2 font-saira-medium text-white">Delete</Text>
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
  const [name, setName] = useState('');
  const [promotionSpots, setPromotionSpots] = useState('');
  const [relegationSpots, setRelegationSpots] = useState('');
  const [divisions, setDivisions] = useState([]);
  const [drawsEnabled, setDrawsEnabled] = useState(false);
  const [specialMatchesEnabled, setSpecialMatchesEnabled] = useState(false);
  const [specialMatchName, setSpecialMatchName] = useState('');
  const [midSeasonTransfersEnabled, setMidSeasonTransfersEnabled] = useState(false);
  const [specialMatchAbbreviation, setSpecialMatchAbbreviation] = useState('');
  const [selectedDivision, setSelectedDivision] = useState(null);
  const bottomSheetRef = useRef(null);
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light;
  const router = useRouter();
  const { districtId, districtName, privateDistrict } = useLocalSearchParams();
  console.log('District:', districtName);
  console.log('Private:', privateDistrict);
  console.log('ID:', districtId);

  // Auto-assign tier based on number of existing divisions
  const nextTier = divisions.length + 1;
  const isTopTier = nextTier === 1;

  const resetForm = () => {
    setName('');
    setPromotionSpots('');
    setRelegationSpots('');
    setDrawsEnabled(false);
    setSpecialMatchesEnabled(false);
    setSpecialMatchName('');
    setSpecialMatchAbbreviation('');
    setSelectedDivision(null);
    setMidSeasonTransfersEnabled(false);
  };

  const handleSave = () => {
    // Check top tier promotions
    const topTier = divisions.find((d) => d.tier === 1);
    if (topTier.promotionSpots !== 0) {
      alert('Top tier promotions must be 0.');
      return;
    }

    // Check bottom tier relegations
    const bottomTier = divisions.find((d) => d.tier === divisions.length);
    if (bottomTier.relegationSpots !== 0) {
      alert('Bottom tier relegations must be 0.');
      return;
    }

    // Check intermediate tiers for mismatch
    const mismatchedTiers = [];
    for (let i = 0; i < divisions.length - 1; i++) {
      const current = divisions[i];
      const next = divisions[i + 1];
      if (current.relegationSpots !== next.promotionSpots) {
        mismatchedTiers.push({
          currentTier: current.tier,
          nextTier: next.tier,
          currentRelegation: current.relegationSpots,
          nextPromotion: next.promotionSpots,
        });
      }
    }

    if (mismatchedTiers.length > 0) {
      const message = mismatchedTiers
        .map(
          (m) =>
            `Tier ${m.currentTier} relegations (${m.currentRelegation}) do not match Tier ${m.nextTier} promotions (${m.nextPromotion})`
        )
        .join('\n');

      Alert.alert(
        'Warning',
        `Some intermediate tiers have mismatched promotions/relegations:\n\n${message}\n\nAre you sure this is what you want?`,
        [
          { text: 'No. Change it.', style: 'destructive' },
          {
            text: 'Yes. Continue anyway.',
            onPress: () =>
              router.push({
                pathname: '/(main)/onboarding/division-rewards',
                params: {
                  divisions: JSON.stringify(divisions),
                  districtId,
                  districtName,
                  privateDistrict,
                },
              }),
          },
        ]
      );
      return;
    }

    // If all checks pass
    console.log('Saving divisions:', divisions);
    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/division-rewards',
      params: { divisions: JSON.stringify(divisions), districtId, districtName, privateDistrict },
    });
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const openSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const handleSubmit = () => {
    if (!name) {
      alert('Please enter a division name.');
      return;
    }
    if (!isTopTier && !promotionSpots) {
      alert('Please enter number of promotion spots.');
      return;
    }
    if (!relegationSpots) {
      alert('Please enter number of relegation spots.');
      return;
    }
    if (specialMatchesEnabled && !specialMatchName) {
      alert('Please enter a name for the special match.');
      return;
    }
    if (specialMatchesEnabled && !specialMatchAbbreviation) {
      alert('Please enter an abbreviation for the special match.');
      return;
    }

    const newDivisionData = {
      id: selectedDivision ? selectedDivision.id : Date.now().toString(),
      name,
      tier: selectedDivision ? selectedDivision.tier : nextTier,
      promotionSpots: isTopTier ? 0 : Number(promotionSpots) || 0,
      relegationSpots: Number(relegationSpots) || 0,
      drawsEnabled,
      midSeasonTransfersEnabled,
      specialMatchesEnabled,
      specialMatchName: specialMatchesEnabled ? specialMatchName : '',
      specialMatchAbbreviation: specialMatchesEnabled ? specialMatchAbbreviation : '',
    };

    setDivisions((prev) => {
      let updated;
      if (selectedDivision) {
        // Update existing
        updated = prev.map((d) => (d.id === selectedDivision.id ? newDivisionData : d));
      } else {
        // Add new
        updated = [...prev, newDivisionData];
      }

      // Sort and adjust tiers/promotions/relegations
      return updated
        .sort((a, b) => a.tier - b.tier)
        .map((division, index, array) => ({
          ...division,
          promotionSpots: index === 0 ? 0 : division.promotionSpots,
          relegationSpots: division.relegationSpots,
        }));
    });

    closeSheet();
    resetForm();
    setSelectedDivision(null);
  };

  const handleDeleteDivision = (divisionId, resetCardPosition) => {
    const division = divisions.find((d) => d.id === divisionId);

    Alert.alert('Delete Division', `Are you sure you want to delete "${division?.name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          // Reset card position when cancelled
          if (resetCardPosition) {
            resetCardPosition();
          }
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // Remove the division and renumber all tiers
          setDivisions((prev) => {
            const filtered = prev.filter((d) => d.id !== divisionId);
            // Renumber tiers sequentially starting from 1
            return filtered
              .sort((a, b) => a.tier - b.tier) // Sort by current tier first
              .map((division, index) => ({
                ...division,
                tier: index + 1, // Assign new tier numbers 1, 2, 3, etc.
              }));
          });
        },
      },
    ]);
  };

  const renderDivisionCard = ({ item }) => (
    <SwipeableCard
      item={item}
      onDelete={(divisionId, resetCardPosition) =>
        handleDeleteDivision(divisionId, resetCardPosition)
      }>
      <Pressable
        onPress={() => handleEditDivision(item)}
        className="flex-row items-center justify-between gap-5 rounded-2xl bg-bg-grouped-2 px-5 py-3 shadow-sm">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="font-saira-medium text-2xl text-text-2">Tier {item.tier} -</Text>
            <Text className="font-saira-medium text-2xl text-text-1">{item.name}</Text>
          </View>
          <View className="flex-row flex-wrap items-center gap-3">
            <View
              className={`${
                item.drawsEnabled
                  ? 'border-theme-green bg-theme-green/50'
                  : 'border-theme-red bg-theme-red/50'
              } max-w-[50%] rounded-lg border px-2`}>
              <Text className="font-saira text-text-1" numberOfLines={1} ellipsizeMode="tail">
                {item.drawsEnabled ? 'Draws Enabled' : 'Draws Disabled'}
              </Text>
            </View>

            <View
              className={`${
                item.specialMatchesEnabled
                  ? 'border-theme-purple bg-theme-purple/50'
                  : 'border-theme-red bg-theme-red/50'
              } max-w-[100%] rounded-lg border px-2`}>
              <Text className="font-saira text-text-1" numberOfLines={1} ellipsizeMode="tail">
                {item.specialMatchesEnabled ? item.specialMatchName : 'No Special Matches'}
              </Text>
            </View>
          </View>
        </View>
        <View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="caret-up-outline" size={32} color="#4CAF50" />
            <Text className="pt-1 font-saira-medium text-2xl text-text-1">
              {item.promotionSpots}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Ionicons name="caret-down-outline" size={32} color="#FF3B30" />
            <Text className="pt-1 font-saira-medium text-2xl text-text-1">
              {item.relegationSpots}
            </Text>
          </View>
        </View>
      </Pressable>
    </SwipeableCard>
  );

  const handleEditDivision = (division) => {
    setSelectedDivision(division);
    setName(division.name);
    setPromotionSpots(division.promotionSpots.toString());
    setRelegationSpots(division.relegationSpots.toString());
    setDrawsEnabled(division.drawsEnabled);
    setSpecialMatchesEnabled(division.specialMatchesEnabled);
    setSpecialMatchName(division.specialMatchName);
    setSpecialMatchAbbreviation(division.specialMatchAbbreviation);
    setMidSeasonTransfersEnabled(division.midSeasonTransfersEnabled);
    openSheet();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 4 of 5',
        }}
      />
      <View className="flex-1 bg-brand px-4">
        <StepPillGroup steps={5} currentStep={4} />
        <View className="my-8">
          <Text className="pb-4 font-delagothic text-3xl text-text-on-brand">
            Add and configure your league's divisions.
          </Text>
          <CTAButton
            text={divisions.length === 0 ? 'Add Division' : 'Add Another Division'}
            icon={<Ionicons name="add" size={24} color="black" />}
            type="yellow"
            textColor="text-black"
            iconColor="black"
            callbackFn={() => {
              resetForm();
              openSheet();
            }}
          />
        </View>

        {divisions.length > 0 ? (
          <>
            <Text className="mb-2 font-saira-medium text-2xl text-text-on-brand">
              {districtName} Divisions
            </Text>
            <FlatList
              data={divisions.sort((a, b) => a.tier - b.tier)} // Always display in tier order
              keyExtractor={(item) => item.id}
              renderItem={renderDivisionCard}
              showsVerticalScrollIndicator={false}
            />
            <Text
              style={{ lineHeight: 22 }}
              className="mx-2 mb-4 mt-2 font-saira-medium text-lg text-text-on-brand-2">
              Ensure divisions are in the correct order. Swipe left on a division to remove it.
            </Text>
            <View className="mb-16 w-full">
              <CTAButton
                icon={<Ionicons name="checkmark" size={24} color="black" />}
                text="Save & Continue"
                type="yellow"
                textColor="text-black"
                iconColor="black"
                callbackFn={handleSave}
              />
            </View>
          </>
        ) : (
          <View>
            <Text className="mb-2 font-saira-medium text-2xl text-text-on-brand">
              {districtName} Divisions
            </Text>
            <View className="items-center justify-center rounded-2xl bg-bg-grouped-1 p-8">
              <Text className="font-saira text-xl text-text-1">No divisions added yet.</Text>
            </View>
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
                <CTAButton text="Save Division" type="brand" callbackFn={handleSubmit} />
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
              Add a Division
            </Text>
            <Pressable className="p-2" onPress={closeSheet}>
              <Ionicons name="close" size={24} color={themeColors.primaryText} />
            </Pressable>
          </BottomSheetView>

          <KeyboardAvoidingView
            behavior="height"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
            <BottomSheetScrollView
              contentContainerStyle={{
                paddingBottom: 200,
                paddingTop: 80,
                paddingHorizontal: 32,
              }}>
              <View className="mb-5 flex-1">
                <CustomTextInput
                  value={name}
                  onChangeText={setName}
                  title="Division Name"
                  placeholder="e.g. Super League"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="trophy-outline"
                  iconColor="#A259FF"
                  titleColor="text-text-1"
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-4 flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <CustomTextInput
                    value={
                      selectedDivision ? selectedDivision.tier.toString() : nextTier.toString()
                    }
                    editable={false}
                    className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 pb-2 text-xl"
                    title="Tier"
                    placeholder="e.g. 1"
                    leftIconName="medal-outline"
                    iconColor="#D7AF31"
                    titleColor="text-text-1"
                    keyboardType="numeric"
                    clearButtonMode="never"
                  />
                </View>
                <View className="flex-1">
                  <CustomTextInput
                    value={isTopTier ? '0' : promotionSpots}
                    onChangeText={setPromotionSpots}
                    title="Promotions"
                    placeholder="e.g. 3"
                    leftIconName="caret-up-outline"
                    iconColor="#34C757"
                    titleColor="text-text-1"
                    editable={!isTopTier}
                    keyboardType="numeric"
                    clearButtonMode="never"
                  />
                </View>
                <View className="flex-1">
                  <CustomTextInput
                    value={relegationSpots}
                    onChangeText={setRelegationSpots}
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

              <View className="mt-5 w-full gap-5">
                <View>
                  <View className="h-16 flex-row items-center gap-5 rounded-xl border border-theme-gray-4 bg-bg-grouped-2 pr-5">
                    <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
                      <Ionicons name="hourglass-outline" size={26} color="#A259FF" />
                    </View>
                    <Text className="flex-1 font-saira-medium text-xl text-text-1">
                      Allow Draws
                    </Text>
                    <Switch
                      value={drawsEnabled}
                      onValueChange={setDrawsEnabled}
                      thumbColor="white"
                      trackColor={{
                        false: 'gray',
                        true: '#4CAF50',
                      }}
                    />
                  </View>
                  <Text className="mt-2 text-text-2">
                    This setting controls whether ties are permitted upon match submission and shown
                    in the league table.{' '}
                  </Text>
                </View>
                <View>
                  <View className="h-16 flex-row items-center gap-5 rounded-xl border border-theme-gray-4 bg-bg-grouped-2 pr-5">
                    <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
                      <Ionicons name="swap-horizontal-outline" size={26} color="#A259FF" />
                    </View>
                    <Text className="flex-1 font-saira-medium text-xl text-text-1">
                      Mid-Season Transfers
                    </Text>
                    <Switch
                      value={midSeasonTransfersEnabled}
                      onValueChange={setMidSeasonTransfersEnabled}
                      thumbColor="white"
                      trackColor={{
                        false: 'gray',
                        true: '#4CAF50',
                      }}
                    />
                  </View>
                  <Text className="mt-2 text-text-2">
                    If disabled, players can still transfer out, but new players cannot transfer in
                    until the next season.
                  </Text>
                </View>
                <View>
                  <View className="h-16 flex-row items-center gap-5 rounded-xl border border-theme-gray-4 bg-bg-grouped-2 pr-5">
                    <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
                      <Ionicons name="star-outline" size={26} color="#A259FF" />
                    </View>
                    <Text className="flex-1 font-saira-medium text-xl text-text-1">
                      Include Bonus Frame
                    </Text>
                    <Switch
                      value={specialMatchesEnabled}
                      onValueChange={(newValue) => {
                        setSpecialMatchesEnabled(newValue);
                        if (!newValue) {
                          setSpecialMatchName('');
                          setSpecialMatchAbbreviation('');
                        }
                      }}
                      thumbColor="white"
                      trackColor={{
                        false: 'gray',
                        true: '#4CAF50',
                      }}
                    />
                  </View>
                  <Text className="mt-2 text-text-2">
                    This setting allows you to create a bonus frame which is to be played once per
                    match and displayed separately in the league table.
                  </Text>
                </View>

                {specialMatchesEnabled && (
                  <View className="flex-1 gap-5">
                    <CustomTextInput
                      value={specialMatchName}
                      onChangeText={setSpecialMatchName}
                      title="Special Match Name"
                      placeholder="e.g. Captain's Cup"
                      leftIconName="trophy-outline"
                      iconColor="#A259FF"
                      titleColor="text-text-1"
                      autoCapitalize="words"
                    />
                    <View>
                      <CustomTextInput
                        value={specialMatchAbbreviation}
                        onChangeText={setSpecialMatchAbbreviation}
                        title="Special Match Abbreviation"
                        placeholder="e.g. CC"
                        leftIconName="pricetag-outline"
                        iconColor="#A259FF"
                        titleColor="text-text-1"
                        maxLength={3}
                        autoCapitalize="characters"
                      />
                      <Text className="mt-2 text-text-2">Max Length: 3</Text>
                    </View>
                  </View>
                )}
              </View>
            </BottomSheetScrollView>
          </KeyboardAvoidingView>
        </BottomSheetWrapper>
      </View>
    </>
  );
}
