import { View, Text, FlatList, Pressable, Switch } from 'react-native';
import { useState, useRef } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import BottomSheet, {
  BottomSheetFooter,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors';
import { useColorScheme } from 'react-native';

export default function CreateDivisions() {
  const [name, setName] = useState('');
  const [promotionSpots, setPromotionSpots] = useState('');
  const [relegationSpots, setRelegationSpots] = useState('');
  const [divisions, setDivisions] = useState([]);
  const [drawsEnabled, setDrawsEnabled] = useState(false);
  const [specialMatchesEnabled, setSpecialMatchesEnabled] = useState(false);
  const bottomSheetRef = useRef(null);
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined
  const router = useRouter();
  const { districtName } = useLocalSearchParams();
  // Auto-assign tier based on number of existing divisions
  const nextTier = divisions.length + 1;

  // Determine if it's top or bottom
  const isTopTier = nextTier === 1;
  const isBottomTier = true; // Always treat the next as bottom until another is added after

  const resetForm = () => {
    setName('');
    setPromotionSpots('');
    setRelegationSpots('');
  };

  const handleSave = () => {
    // Save the division data
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

    const newDivision = {
      id: Date.now().toString(),
      name,
      tier: nextTier,
      promotionSpots: isTopTier ? 0 : Number(promotionSpots) || 0,
      relegationSpots: isBottomTier ? 0 : Number(relegationSpots) || 0,
      drawsEnabled,
      specialMatchesEnabled,
    };

    setDivisions((prev) => [...prev, newDivision]);
    closeSheet();
    resetForm();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 4',
        }}
      />
      <View className="flex-1 bg-brand px-4">
        <StepPillGroup steps={4} currentStep={4} />
        <View className="my-8">
          <CTAButton
            text={divisions.length === 0 ? 'Add Division' : 'Add Another Division'}
            type="brown"
            callbackFn={openSheet}
          />
        </View>

        {divisions.length > 0 ? (
          <>
            <Text className="mb-2 font-saira-medium text-2xl text-text-on-brand">
              {districtName} Divisions
            </Text>
            <FlatList
              data={divisions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="mb-3 flex-row items-center justify-between gap-5 rounded-2xl bg-white px-5 py-3 shadow-sm">
                  <Text className="h-12 w-12 items-center justify-center rounded-full bg-brand p-3 text-center font-saira-medium text-2xl text-text-on-brand">
                    {item.tier}
                  </Text>
                  <View className="flex-1 gap-2">
                    <Text className="font-saira-medium text-2xl text-text-1">{item.name}</Text>
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`${item.drawsEnabled ? 'border-theme-green bg-theme-green/50' : 'border-theme-red bg-theme-red/50'} rounded-full border px-2 py-1`}>
                        <Text>{item.drawsEnabled ? 'Draws' : 'No Draws'}</Text>
                      </View>
                      <View
                        className={`${item.specialMatchesEnabled ? 'border-theme-green bg-theme-green/50' : 'border-theme-red bg-theme-red/50'} rounded-full border px-2 py-1`}>
                        <Text>
                          {item.specialMatchesEnabled ? 'Special Matches' : 'No Special Matches'}
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
                </View>
              )}
            />
            <View className="mb-16 mt-8 w-full">
              <CTAButton text="Save & Continue" type="brown" />
            </View>
          </>
        ) : (
          <View className="items-center justify-center rounded-2xl bg-bg-grouped-1 p-16">
            <Text className="font-saira text-xl text-text-1">No divisions added yet.</Text>
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

          {/* Scrollable content with top padding to avoid overlap */}
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingBottom: 240,
              paddingTop: 80,
              paddingHorizontal: 32,
            }}>
            <View className="mb-5 flex-1">
              <CustomTextInput
                value={name}
                onChangeText={setName}
                title="Division Name"
                placeholder="e.g. Premier Division"
                className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                leftIconName="trophy-outline"
                iconColor="#A259FF" //purple
                titleColor="text-text-1"
              />
            </View>
            <View className="mb-4 flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <CustomTextInput
                  value={nextTier.toString()}
                  editable={false}
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 pb-2 text-xl"
                  title="Tier"
                  placeholder="e.g. 1"
                  leftIconName="medal-outline"
                  iconColor="#D7AF31" // Dark Gold color for tier
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
                  iconColor="#34C757" //RGB(52,199,89)
                  titleColor="text-text-1"
                  editable={!isTopTier}
                  keyboardType="numeric"
                  clearButtonMode="never"
                />
              </View>
              <View className="flex-1">
                <CustomTextInput
                  value={isBottomTier ? '0' : relegationSpots}
                  onChangeText={setRelegationSpots}
                  title="Relegations"
                  placeholder="e.g. 3"
                  iconColor="#FF3B30" //RGB(255,59,48)
                  leftIconName="caret-down-outline"
                  titleColor="text-text-1"
                  keyboardType="numeric"
                  clearButtonMode="never"
                />
              </View>
            </View>
            <View className="mt-5 w-full gap-5">
              <View className="h-16 flex-row items-center gap-5 rounded-xl border border-theme-gray-4 bg-bg-grouped-2 pr-5">
                <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-2 bg-bg-grouped-1 pl-3 pr-4">
                  <Ionicons name="hourglass-outline" size={26} color="#A259FF" />
                </View>
                <Text className="flex-1 font-saira-medium text-xl text-text-1">Allow Draws</Text>

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
              <View className="h-16 flex-row items-center gap-5 rounded-xl border border-theme-gray-4 bg-bg-grouped-2 pr-5">
                <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-2 bg-bg-grouped-1 pl-3 pr-4">
                  <Ionicons name="star-outline" size={26} color="#A259FF" />
                </View>
                <Text className="flex-1 font-saira-medium text-xl text-text-1">
                  Include Special Matches
                </Text>

                <Switch
                  value={specialMatchesEnabled}
                  onValueChange={setSpecialMatchesEnabled}
                  thumbColor="white"
                  trackColor={{
                    false: 'gray',
                    true: '#4CAF50',
                  }}
                />
              </View>
            </View>
          </BottomSheetScrollView>
        </BottomSheetWrapper>
      </View>
    </>
  );
}
