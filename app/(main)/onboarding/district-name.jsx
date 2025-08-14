import { View, Text, Alert } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';
import { useRouter } from 'expo-router';

export default function DistrictName() {
  const router = useRouter();
  const [districtName, setDistrictName] = useState('');

  const handleSubmit = () => {
    if (!districtName.trim()) {
      Alert.alert('Missing Info', 'Please enter a district name.');
      return;
    }
    router.push({
      pathname: '/(main)/onboarding/create-divisions',
      params: { districtName: districtName.trim() },
    });
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
        <Text className="my-4 pt-5 font-delagothic text-5xl text-text-on-brand">
          Please enter the name of your district.
        </Text>
        <View className="mb-5">
          <CustomTextInput
            label="District Name"
            value={districtName}
            onChangeText={setDistrictName}
            leftIconName="map-outline"
            iconColor="#A259FF" //purple
            placeholder="e.g. Downtown District"
          />
        </View>
        <CTAButton type="brown" text="Continue" callbackFn={handleSubmit} />
      </View>
    </>
  );
}
