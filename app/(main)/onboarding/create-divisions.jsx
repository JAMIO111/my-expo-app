import { View, Text, TextInput, FlatList } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';

export default function CreateDivisions() {
  const [name, setName] = useState('');
  const [promotionSpots, setPromotionSpots] = useState('');
  const [relegationSpots, setRelegationSpots] = useState('');
  const [divisions, setDivisions] = useState([]);

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
    };

    setDivisions((prev) => [...prev, newDivision]);
    resetForm();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3',
        }}
      />
      <View className="flex-1 bg-brand px-4">
        <StepPillGroup steps={3} currentStep={3} />
        <Text className="mb-4 pt-10 text-xl font-bold text-white">Add Division</Text>
        <View className="flex-row items-center justify-between gap-5">
          <View className="flex-1">
            <CustomTextInput
              value={name}
              onChangeText={setName}
              title="Division Name"
              placeholder="e.g. Premier Division"
              className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
              leftIconName="trophy-outline"
              titleColor="text-text-on-brand"
            />
          </View>
          <View className="w-16">
            <Text className="mb-1 font-saira-medium text-white">Tier</Text>
            <TextInput
              value={nextTier.toString()}
              editable={false}
              className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 pb-2 text-xl"
            />
          </View>
        </View>
        <View className="mb-4 flex-row items-center justify-between gap-5">
          <View className="flex-1">
            <Text className="mb-1 font-saira-medium text-white">Promotion Spots</Text>
            <TextInput
              value={isTopTier ? '0' : promotionSpots}
              onChangeText={setPromotionSpots}
              placeholder="e.g. 2"
              keyboardType="numeric"
              editable={!isTopTier}
              className={`mb-4 h-12 rounded-lg border px-3 pb-2 text-xl ${
                isTopTier ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-gray-300 bg-white'
              }`}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 font-saira-medium text-white">Relegation Spots</Text>
            <TextInput
              value={isBottomTier ? '0' : relegationSpots}
              onChangeText={setRelegationSpots}
              placeholder="e.g. 2"
              keyboardType="numeric"
              editable={!isBottomTier}
              className={`mb-4 h-12 rounded-lg border px-3 pb-2 text-xl ${
                isBottomTier
                  ? 'border-gray-200 bg-gray-100 text-gray-400'
                  : 'border-gray-300 bg-white'
              }`}
            />
          </View>
        </View>

        <CTAButton text="Add Division" type="info" callbackFn={handleSubmit} />

        {divisions.length > 0 && (
          <>
            <Text className="mb-2 mt-8 text-lg font-bold text-white">Divisions Added</Text>
            <FlatList
              data={divisions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="mb-2 rounded bg-white p-3 shadow-sm">
                  <Text className="font-semibold text-gray-900">{item.name}</Text>
                  <Text className="text-gray-700">Tier: {item.tier}</Text>
                  <Text className="text-gray-700">Promotion Spots: {item.promotionSpots}</Text>
                  <Text className="text-gray-700">Relegation Spots: {item.relegationSpots}</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </>
  );
}
