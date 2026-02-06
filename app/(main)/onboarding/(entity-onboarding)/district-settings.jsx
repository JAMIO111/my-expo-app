import { View, Text } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomDropdown from '@components/CustomDropdown';
import { useRouter } from 'expo-router';
import CustomTextInput from '@components/CustomTextInput';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';

export default function DistrictSettings() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [scoringSystem, setScoringSystem] = useState(null);
  const [framesPerMatch, setFramesPerMatch] = useState('');
  const [pointsForWin, setPointsForWin] = useState('');
  const [pointsForDraw, setPointsForDraw] = useState('');
  const [pointsForLoss, setPointsForLoss] = useState('');

  const handleSubmit = async () => {
    if (!scoringSystem) {
      Toast.show({
        type: 'error',
        text1: 'Missing Info',
        text2: 'Please select a scoring system.',
      });
      return;
    }
    if (scoringSystem === 'points' && (!pointsForWin || !pointsForDraw || !pointsForLoss)) {
      Toast.show({
        type: 'error',
        text1: 'Missing Info',
        text2: 'Please enter points for win, draw, and loss.',
      });
      return;
    }

    try {
      // ✅ If unique, navigate
      router.push({
        pathname: '/(main)/onboarding/(entity-onboarding)/create-divisions',
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3 of 5',
        }}
      />
      <SafeViewWrapper
        useTopInset={false}
        useBottomInset={false}
        topColor="bg-brand"
        bottomColor="bg-brand-dark">
        <View className="flex-1 bg-brand px-4 pb-8">
          <StepPillGroup steps={5} currentStep={3} />
          <Text className="my-4 pt-5 font-delagothic text-4xl text-text-on-brand">
            Configure the league settings.
          </Text>
          <ScrollView className="">
            <CustomDropdown
              title="Point Scoring System"
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
          <CTAButton
            type="yellow"
            textColor="text-black"
            text="Continue"
            callbackFn={handleSubmit}
          />
        </View>
      </SafeViewWrapper>
    </>
  );
}
