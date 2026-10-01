import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { View, Text, Switch } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import CustomTextInput from '@components/CustomTextInput';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';

export default function DistrictName() {
  useOnboardingStep(2, 4);
  const router = useRouter();
  const [districtName, setDistrictName] = useState('');
  const [privateDistrict, setPrivateDistrict] = useState(false);

  console.log('DistrictName:', districtName, 'PrivateDistrict:', privateDistrict);

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
    if (districtName.trim().length < 3 || districtName.trim().length > 60) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'The league name must be between 3 and 60 characters.',
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
        (d) => d.name?.trim().toLowerCase() === districtName?.trim().toLowerCase()
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
          districtName: capitaliseEachWord(districtName?.trim()),
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

  return (
    <OnboardingScreen
      title="Name your league"
      subtitle="This is how players will find and recognise your league."
      onCta={handleSubmit}
      ctaDisabled={districtName.trim().length < 3}>
      <View className="gap-6">
        <OnboardingInput
          label="League name"
          icon="map-outline"
          placeholder="e.g. Blyth & District"
          value={districtName}
          onChangeText={setDistrictName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          maxLength={60}
        />
        <ToggleCard
          delay={90}
          icon="lock-closed-outline"
          title="Private league"
          value={privateDistrict}
          onValueChange={setPrivateDistrict}
          description="Hide fixtures, results, standings and leaderboards from people in other leagues."
        />
      </View>
    </OnboardingScreen>
  );
}
