import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { View, Text, Switch, Platform } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import CustomDatePicker from '@components/CustomDatePicker';
import CustomMultiSelect from '@components/CustomMultiSelect';
import { useUser } from '@contexts/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import TieBreakEditor, { DEFAULT_TIE_BREAKS } from '@components/TieBreakEditor';

export default function SeasonName() {
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
    <>
      <Stack.Screen
        options={{
          title: 'Step 4 of 4',
        }}
      />
      <View className="flex-1 bg-brand px-4">
        <StepPillGroup steps={4} currentStep={4} />
        <Text className="my-4 pt-2 font-delagothic text-3xl text-text-on-brand">
          Let's create your first season!
        </Text>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20, gap: 20 }}>
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
          <View className="gap-2">
            <Text className="px-2 font-saira-semibold text-xl text-text-on-brand">
              Tie-break rules
            </Text>
            <Text
              style={{ lineHeight: 22 }}
              className="px-2 font-saira-medium text-lg text-text-on-brand-2">
              When teams are level on points, these are applied in order until the tie is broken. You
              can change them later in league settings.
            </Text>
            <TieBreakEditor rules={tieBreakRules} onChange={setTieBreakRules} onBrand />
          </View>
        </KeyboardAwareScrollView>
        <View className="px-2 py-8">
          <CTAButton
            type="yellow"
            textColor="text-black"
            text={loading ? 'Creating League...' : 'Create Season'}
            callbackFn={handleSubmit}
            disabled={loading}
          />
        </View>
      </View>
    </>
  );
}
