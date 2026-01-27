import { Pressable, Text, View, Image, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { trophyIcons } from '@lib/badgeIcons';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import CTAButton from '@components/CTAButton';
import { ScrollView } from 'react-native-gesture-handler';
import StepPillGroup from '@components/StepPillGroup';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

const DivisionRewards = () => {
  const router = useRouter();
  const { client: supabase } = useSupabaseClient();
  const { divisions, districtId, districtName, privateDistrict } = useLocalSearchParams();
  const parsedDivisions = JSON.parse(divisions || '[]');
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];

  const bottomSheetRef = useRef(null);

  // Track both winner and runner-up rewards for each division
  const [divisionRewards, setDivisionRewards] = useState(
    parsedDivisions.map(() => ({ winner: null, runnerUp: null }))
  );

  const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(null);
  const [selectedRewardType, setSelectedRewardType] = useState(null); // 'winner' or 'runnerUp'

  const openSheet = (index, type) => {
    setSelectedDivisionIndex(index);
    setSelectedRewardType(type);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const selectReward = (reward) => {
    setDivisionRewards((prev) => {
      const updated = [...prev];
      updated[selectedDivisionIndex][selectedRewardType] = reward;
      return updated;
    });
    closeSheet();
  };

  const removeReward = (index, type) => {
    setDivisionRewards((prev) => {
      const updated = [...prev];
      updated[index][type] = null;
      return updated;
    });
  };

  const handleSubmit = async () => {
    // 1️⃣ Check all winner rewards
    const missingWinners = divisionRewards.some((r) => !r.winner || !r.winner.name);
    const missingRunners = divisionRewards.some((r) => !r.runnerUp || !r.runnerUp.name);

    if (missingWinners || missingRunners) {
      Alert.alert(
        'Missing Rewards',
        'Please make sure every division has an option selected for winners and runners-up. If you do not want to award a prize for a division, please select "No Reward".'
      );
      return;
    }

    // 2️⃣ Confirm before submit
    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to save these rewards and create your district?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Save',
          onPress: async () => {
            try {
              // Build your payload
              const payload = parsedDivisions.map((division, idx) => ({
                ...division,
                winnerReward: divisionRewards[idx].winner,
                runnerUpReward: divisionRewards[idx].runnerUp,
              }));

              // Example Supabase insert/update
              const { error: districtError } = await supabase
                .from('Districts')
                .update({
                  name: districtName,
                  private: privateDistrict,
                })
                .eq('id', districtId);

              const { error: divisionsError } = await supabase.from('Divisions').upsert(payload);

              if (districtError || divisionsError) throw error;

              // Navigate or show success
              router.push({
                pathname: '/(main)/onboarding/admin-profile',
              });
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'There was a problem creating your district. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3',
        }}
      />
      <View className="flex-1 items-center justify-start bg-brand">
        <StepPillGroup steps={3} currentStep={3} />
        <Text
          style={{ fontSize: 36, lineHeight: 50 }}
          className="mb-8 px-4 font-delagothic text-text-on-brand">
          Select rewards for each division
        </Text>
        <Text className="mb-2 w-full px-4 font-saira-medium text-lg text-text-on-brand-2">
          Tap on a division’s reward to select it
        </Text>
        <ScrollView className="w-full p-4">
          {parsedDivisions?.map((division, index) => (
            <View
              key={index}
              className="mb-3 w-full rounded-3xl border border-theme-gray-4 bg-bg-grouped-1 p-3">
              <View className="mb-3 flex-row items-center gap-2">
                <Text className="px-2 font-saira-medium text-2xl text-text-2">
                  Tier {division.tier} -
                </Text>
                <Text className="font-saira-medium text-2xl text-text-1">{division.name}</Text>
              </View>

              {/* Winner reward */}
              <Pressable
                onPress={() => openSheet(index, 'winner')}
                className="mb-3 flex-row items-center gap-5 rounded-2xl border border-theme-gray-4 bg-bg-grouped-2 p-2 pr-3">
                {divisionRewards[index]?.winner?.icon ? (
                  <Image source={divisionRewards[index]?.winner?.icon} className="h-20 w-16" />
                ) : divisionRewards[index]?.winner?.name === 'No Reward' ? (
                  <Ionicons name="ban-outline" size={56} color="red" />
                ) : (
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-brand">
                    <Ionicons name="add" size={28} color="white" />
                  </View>
                )}
                <Text className="flex-1 font-saira-medium text-xl text-text-2">
                  Winner: {divisionRewards[index]?.winner?.name || 'Not selected'}
                </Text>
                {divisionRewards[index]?.winner && (
                  <Pressable
                    className="rounded-xl border border-theme-red bg-theme-red/80 p-3"
                    onPress={() => removeReward(index, 'winner')}>
                    <Ionicons name="trash-outline" size={24} color="white" />
                  </Pressable>
                )}
              </Pressable>

              {/* Runner-up reward */}
              <Pressable
                onPress={() => openSheet(index, 'runnerUp')}
                className="flex-row items-center gap-5 rounded-2xl border border-theme-gray-4 bg-bg-grouped-2 p-2 pr-3">
                {divisionRewards[index]?.runnerUp?.icon ? (
                  <Image source={divisionRewards[index]?.runnerUp?.icon} className="h-20 w-16" />
                ) : divisionRewards[index]?.runnerUp?.name === 'No Reward' ? (
                  <Ionicons name="ban-outline" size={56} color="red" />
                ) : (
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-brand">
                    <Ionicons name="add" size={28} color="white" />
                  </View>
                )}
                <Text className="flex-1 font-saira-medium text-xl text-text-2">
                  Runner-up: {divisionRewards[index]?.runnerUp?.name || 'Not selected'}
                </Text>

                {divisionRewards[index]?.runnerUp && (
                  <Pressable
                    className="rounded-xl border border-theme-red bg-theme-red/80 p-3"
                    onPress={() => removeReward(index, 'runnerUp')}>
                    <Ionicons name="trash-outline" size={24} color="white" />
                  </Pressable>
                )}
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <View className="w-full px-4 pb-16 pt-4">
          <CTAButton
            text="Create District"
            type="yellow"
            textColor="black"
            callbackFn={handleSubmit}
          />
        </View>

        {/* Bottom sheet for choosing rewards */}
        <BottomSheetWrapper ref={bottomSheetRef} initialIndex={-1} snapPoints={['90%']}>
          {/* Header */}
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
            <Text
              style={{ lineHeight: 40, fontSize: 24 }}
              className="font-saira-medium text-text-1">
              Choose {selectedRewardType === 'winner' ? "Winner's" : "Runner-up's"} award
            </Text>
            <Pressable className="p-2" onPress={closeSheet}>
              <Ionicons name="close" size={24} color={themeColors.primaryText} />
            </Pressable>
          </BottomSheetView>

          {/* Grid of rewards */}
          <BottomSheetScrollView
            className="bg-bg-grouped-1"
            contentContainerStyle={{
              paddingBottom: 200,
              paddingTop: 80,
              paddingHorizontal: 16,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
            {trophyIcons?.map((reward, idx) => (
              <Pressable
                key={idx}
                onPress={() => selectReward(reward)}
                className={`rounded-2xl bg-bg-grouped-2 ${
                  selectedDivisionIndex !== null &&
                  selectedRewardType &&
                  divisionRewards[selectedDivisionIndex][selectedRewardType]?.name === reward.name
                    ? 'border-2 border-brand'
                    : 'border border-theme-gray-4'
                }`}
                style={{
                  width: '48%',
                  marginBottom: 20,
                  alignItems: 'center',
                }}>
                <Image
                  source={reward.icon}
                  style={{ width: 80, height: 120, resizeMode: 'contain' }}
                />
                <Text
                  style={{
                    textAlign: 'center',
                    lineHeight: 24,
                    fontSize: 16,
                    marginVertical: 8,
                  }}
                  className="font-saira-medium text-text-1">
                  {reward.name}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => selectReward({ name: 'No Reward' })}
              className={`${
                selectedDivisionIndex !== null &&
                selectedRewardType &&
                divisionRewards[selectedDivisionIndex][selectedRewardType]?.name === 'No Reward'
                  ? 'border-2 border-brand'
                  : 'border border-theme-gray-4'
              } w-full flex-row items-center justify-center gap-4 rounded-2xl bg-bg-grouped-2 p-6`}
              style={{
                width: '100%',
                marginBottom: 20,
                alignItems: 'center',
              }}>
              <Ionicons name="ban-outline" size={60} color="red" />
              <Text
                style={{
                  textAlign: 'center',
                  lineHeight: 60,
                  fontSize: 36,
                  marginVertical: 0,
                }}
                className="font-saira-medium text-text-1">
                No Reward
              </Text>
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheetWrapper>
      </View>
    </>
  );
};

export default DivisionRewards;
