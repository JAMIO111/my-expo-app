import { View, Text, Alert, Switch } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';
import { useRouter } from 'expo-router';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function DistrictName() {
  const router = useRouter();
  const [districtName, setDistrictName] = useState('');
  const [privateDistrict, setPrivateDistrict] = useState(false);
  const { client: supabase } = useSupabaseClient();
  const { districtId } = useLocalSearchParams();

  const capitaliseEachWord = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .filter(Boolean) // remove empty strings from multiple spaces
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleSubmit = async () => {
    if (!districtName.trim()) {
      Alert.alert('Missing Info', 'Please enter a district name.');
      return;
    }

    try {
      // Fetch all districts
      const { data: existingDistricts, error } = await supabase.from('Districts').select('name');

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Unable to check districts. Please try again.');
        return;
      }

      // Check uniqueness (case-insensitive match)
      const nameExists = existingDistricts.some(
        (d) => d.name.trim().toLowerCase() === districtName.trim().toLowerCase()
      );

      if (nameExists) {
        Alert.alert(
          'Duplicate',
          'This district name already exists. Please enter a different name.'
        );
        return;
      }

      // ✅ If unique, navigate
      router.push({
        pathname: '/(main)/onboarding/(entity-onboarding)/district-settings',
        params: {
          districtId,
          districtName: capitaliseEachWord(districtName.trim()),
          privateDistrict,
        },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 1',
        }}
      />
      <View className="flex-1 bg-brand px-4">
        <StepPillGroup steps={3} currentStep={1} />
        <Text className="my-4 pt-5 font-delagothic text-5xl text-text-on-brand">
          Please enter the name of your district.
        </Text>
        <View className="mb-6">
          <CustomTextInput
            label="District Name"
            value={districtName}
            onChangeText={setDistrictName}
            leftIconName="map-outline"
            iconColor="purple"
            placeholder="e.g. Downtown District"
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>
        <View className="h-16 flex-row items-center gap-5 rounded-xl border border-theme-gray-4 bg-bg-grouped-2 pr-5">
          <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
            <Ionicons name="lock-closed-outline" size={26} color="purple" />
          </View>
          <Text className="flex-1 font-saira-medium text-xl text-text-1">Private District</Text>
          <Switch
            value={privateDistrict}
            onValueChange={(newValue) => {
              setPrivateDistrict(newValue);
            }}
            thumbColor="white"
            trackColor={{
              false: 'gray',
              true: '#4CAF50',
            }}
          />
        </View>
        <Text
          style={{ lineHeight: 22 }}
          className="mb-6 mt-2 font-saira-medium text-lg text-text-on-brand-2">
          Do you want to hide fixtures, results, standings and leaderboards from users from other
          districts?
        </Text>
        <CTAButton type="yellow" textColor="text-black" text="Continue" callbackFn={handleSubmit} />
      </View>
    </>
  );
}
