import { View, Text, Switch, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import CustomDatePicker from '../../../components/CustomDatePicker';
import CustomMultiSelect from '../../../components/CustomMultiSelect';
import { StatusBar } from 'expo-status-bar';

export default function SeasonName() {
  const router = useRouter();
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date
  const [seasonStatus, setSeasonStatus] = useState(['draft']);

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
    if (!seasonName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Season name cannot be empty.',
      });
      return;
    }

    try {
      // Fetch all districts
      const { data: existingDistricts, error } = await supabase.from('Districts').select('name');

      if (error) {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load data. Please try again.',
        });
        return;
      }

      // Check uniqueness (case-insensitive match)
      const nameExists = existingDistricts.some(
        (d) => d.name.trim().toLowerCase() === districtName.trim().toLowerCase()
      );

      if (nameExists) {
        Toast.show({
          type: 'error',
          text1: 'District Name Taken',
          text2: 'This district name is already taken. Please choose another.',
        });
        return;
      }

      // ✅ If unique, navigate
      router.push({
        pathname: '/(main)/onboarding/(entity-onboarding)/create-divisions',
        params: {
          districtId,
          districtName: capitaliseEachWord(districtName.trim()),
          privateDistrict,
        },
      });
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  console.log('start date :', startDate);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 4 of 4',
        }}
      />
      <StatusBar style="light" />
      <View className="flex-1 bg-brand px-4">
        <StepPillGroup steps={4} currentStep={4} />
        <Text className="my-4 pt-2 font-delagothic text-3xl text-text-on-brand">
          Let's create your first season!
        </Text>
        <ScrollView contentContainerStyle={{ paddingBottom: 20, gap: 20 }} className="flex-1">
          <CustomTextInput
            title="Season Name"
            value={seasonName}
            onChangeText={setSeasonName}
            leftIconName="pencil-outline"
            iconColor="purple"
            placeholder={`e.g. 20${new Date().getFullYear().toString().slice(-2)}/${(new Date().getFullYear() + 1).toString().slice(-2)}, Winter ${new Date().getFullYear()}`}
            autoCapitalize="words"
            returnKeyType="done"
          />
          <CustomDatePicker
            title="Season Start Date"
            value={startDate}
            onChange={setStartDate}
            leftIconName="calendar-outline"
            iconColor="purple"
          />
          <CustomMultiSelect
            title="Season Status"
            leftIconName="pulse-outline"
            iconColor="purple"
            titleColor="text-text-on-brand"
            multiSelect={false}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Draft', value: 'draft' },
            ]}
            selectedValues={seasonStatus}
            onValueChange={setSeasonStatus}
          />
        </ScrollView>
        <View className="px-2 py-8">
          <CTAButton
            type="yellow"
            textColor="text-black"
            text="Continue"
            callbackFn={handleSubmit}
          />
        </View>
      </View>
    </>
  );
}
