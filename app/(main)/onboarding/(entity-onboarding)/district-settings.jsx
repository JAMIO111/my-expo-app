import { View, Text, Alert, Switch, FlatList } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomDropdown from '@components/CustomDropdown';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import CustomTextInput from '@components/CustomTextInput';
import { ScrollView } from 'react-native-gesture-handler';

export default function DistrictSettings() {
  const router = useRouter();
  const [scoringSystem, setScoringSystem] = useState(null);
  const [framesPerMatch, setFramesPerMatch] = useState('');
  const [pointsForWin, setPointsForWin] = useState('');
  const [pointsForDraw, setPointsForDraw] = useState('');
  const [pointsForLoss, setPointsForLoss] = useState('');

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
        pathname: '/(main)/onboarding/create-divisions',
        params: {
          ...params,
          scoringSystem: scoringSystem,
          framesPerMatch: framesPerMatch,
          pointsForWin: scoringSystem === 'points' ? pointsForWin : null,
          pointsForDraw: scoringSystem === 'points' ? pointsForDraw : null,
          pointsForLoss: scoringSystem === 'points' ? pointsForLoss : null,
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
      <View className="flex-1 bg-brand px-4 pb-8">
        <StepPillGroup steps={3} currentStep={1} />
        <Text className="my-4 pt-5 font-delagothic text-4xl text-text-on-brand">
          Configure the league settings.
        </Text>
        <ScrollView className="">
          <CustomDropdown
            title="Point Scoring System"
            titleColor="text-text-2"
            leftIconName="layers-outline"
            iconColor="purple"
            placeholder="Select Scoring System"
            value={scoringSystem}
            onChange={setScoringSystem}
            options={[
              { label: 'Frames Won', value: 'frame_won' },
              { label: 'Points for Result', value: 'points' },
              { label: 'Frame Difference', value: 'frame_diff' },
            ]}
          />

          <Text
            style={{ lineHeight: 22 }}
            className="mb-6 mt-2 px-2 font-saira-medium text-lg text-text-on-brand-2">
            {scoringSystem === 'points'
              ? 'Teams will be awarded points based on match results. You can customise the points awarded for a win, draw, and loss.'
              : scoringSystem === 'frame_won'
                ? 'Both teams will be awarded a point for each frame they win.'
                : 'The winning team will be awarded points based on the difference in frames won between both teams.'}
          </Text>

          {scoringSystem === 'points' ? (
            <View className="mb-6 gap-3">
              <CustomTextInput
                value={pointsForWin}
                onChangeText={setPointsForWin}
                title="Points for a Win"
                placeholder="e.g. 3"
                leftIconName="caret-up-outline"
                iconColor="#34C757"
                titleColor="text-text-1"
                keyboardType="numeric"
                clearButtonMode="never"
              />
              <CustomTextInput
                value={pointsForDraw}
                onChangeText={setPointsForDraw}
                title="Points for a Draw"
                placeholder="e.g. 1"
                leftIconName="caret-forward-outline"
                iconColor="#FBBF24"
                titleColor="text-text-1"
                keyboardType="numeric"
                clearButtonMode="never"
              />
              <CustomTextInput
                value={pointsForLoss}
                onChangeText={setPointsForLoss}
                title="Points for a Loss"
                placeholder="e.g. 0"
                leftIconName="caret-down-outline"
                iconColor="#EF4444"
                titleColor="text-text-1"
                keyboardType="numeric"
                clearButtonMode="never"
              />
            </View>
          ) : null}
        </ScrollView>
        <Text
          style={{ lineHeight: 22 }}
          className="mb-4 mt-2 px-2 font-saira-medium text-lg text-text-on-brand-2">
          If you need to change these settings later to be division specific, you can do so in the
          settings later.
        </Text>
        <CTAButton type="yellow" textColor="text-black" text="Continue" callbackFn={handleSubmit} />
      </View>
    </>
  );
}
