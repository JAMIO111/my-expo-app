import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { View, Text, Switch, Platform } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import CustomTextInput from '@components/CustomTextInput';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import CustomDatePicker from '@components/CustomDatePicker';
import CustomMultiSelect from '@components/CustomMultiSelect';
import { useUser } from '@contexts/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import TieBreakEditor, { DEFAULT_TIE_BREAKS } from '@components/TieBreakEditor';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';

export default function SeasonName() {
  useOnboardingStep(4, 4);
  const router = useRouter();
  const { player } = useUser();
  const queryClient = useQueryClient();
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date
  const [seasonStatus, setSeasonStatus] = useState(['draft']);
  const [loading, setLoading] = useState(false);
  const [tieBreakRules, setTieBreakRules] = useState(DEFAULT_TIE_BREAKS);

  const { districtId, districtName, privateDistrict, divisions } = useLocalSearchParams();

  console.log('Received params:', { districtId, districtName, privateDistrict, divisions });
  console.log('SeasonName:', seasonName, 'StartDate:', startDate, 'SeasonStatus:', seasonStatus);
  console.log('Parsed divisions:', JSON.parse(divisions || '[]'));
  console.log('Player Info:', player);

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
        text1: 'Season Name Missing',
        text2: 'Please enter a season name.',
      });
      return;
    }
    if (!startDate) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Date',
        text2: 'Please select a valid start date.',
      });
      return;
    }
    if (seasonStatus.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Status',
        text2: 'Please select a season status.',
      });
      return;
    }
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('create_district_season_divisions', {
        _district_id: districtId,
        _district_name: districtName,
        _is_private: privateDistrict,
        _season_name: capitaliseEachWord(seasonName?.trim()),
        _start_date: startDate,
        _season_status: seasonStatus[0], // since it's single select, take the first value
        _divisions: JSON.parse(divisions || '[]'),
        _admin_id: player?.id,
        _tie_break_rules: tieBreakRules,
      });

      if (error) throw error;

      queryClient.invalidateQueries(['authUserProfile']);

      Toast.show({
        type: 'success',
        text1: 'Season Created',
        text2: 'Everything is ready to go.',
      });
    } catch (err) {
      console.error(err);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  console.log('start date :', startDate);

  return (
    <OnboardingScreen
      title="Create your first season"
      subtitle="Everything in your league runs inside a season."
      onCta={handleSubmit}
      ctaText={loading ? 'Creating league…' : 'Create season'}
      ctaDisabled={loading || !seasonName.trim()}
      ctaLoading={loading}>
      <View className="gap-6">
        <OnboardingInput
          label="Season name"
          icon="pencil-outline"
          value={seasonName}
          onChangeText={setSeasonName}
          placeholder={`e.g. ${new Date().getFullYear()}/${(new Date().getFullYear() + 1).toString().slice(-2)}`}
          autoCapitalize="words"
          returnKeyType="done"
        />
        <CustomDatePicker
          title="Season start date"
          value={startDate}
          onChange={setStartDate}
          leftIconName="calendar-outline"
          iconColor="purple"
        />

        <View className="gap-3">
          <Text className="pl-1 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
            Season status
          </Text>
          <ChoiceCard
            icon="play"
            iconColor="#10B981"
            title="Active"
            subtitle="Starts straight away"
            selected={seasonStatus[0] === 'active'}
            onPress={() => setSeasonStatus(['active'])}
          />
          <ChoiceCard
            icon="create-outline"
            iconColor="#6B7280"
            title="Draft"
            subtitle="Set things up first, start it when you're ready"
            selected={seasonStatus[0] === 'draft'}
            onPress={() => setSeasonStatus(['draft'])}
          />
        </View>

        <View className="gap-3">
          <Text className="pl-1 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
            Tie-break rules
          </Text>
          <Text className="pl-1 font-saira text-base leading-5 text-text-on-brand-2">
            When teams are level on points, these are applied in order. You can change them later in
            league settings.
          </Text>
          <TieBreakEditor rules={tieBreakRules} onChange={setTieBreakRules} onBrand />
        </View>
      </View>
    </OnboardingScreen>
  );
}
