import { View, Text, Switch, ScrollView } from 'react-native';
import { useState } from 'react';
import CustomTextInput from './CustomTextInput';
import CTAButton from './CTAButton';
import { supabase } from '@lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

const EditDivisionForm = ({ division, closeModal }) => {
  console.log('Editing Division:', division);
  const [name, setName] = useState(division?.name || '');
  const [groupName, setGroupName] = useState(division?.group_name || '');
  const [maxCompetitors, setMaxCompetitors] = useState(division?.max_competitors?.toString() || '');
  const [midSeasonTransfers, setMidSeasonTransfers] = useState(
    division?.mid_season_transfers || false
  );
  const [adminApprovalRequired, setAdminApprovalRequired] = useState(
    division?.admin_approval_required || false
  );
  const [promotions, setPromotions] = useState(division?.promotion_spots?.toString() || '');
  const [relegations, setRelegations] = useState(division?.relegation_spots?.toString() || '');
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      const { error } = await supabase.rpc('update_division_and_propagate', {
        p_division_id: division.id,
        p_name: name,
        p_group_name: groupName,
        p_promotion_spots: Number(promotions),
        p_relegation_spots: Number(relegations),
        p_max_competitors: Number(maxCompetitors),
        p_admin_approval_required: adminApprovalRequired,
        p_mid_season_transfers: midSeasonTransfers,
      });

      if (error) {
        throw error;
      }

      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: 'Division updated successfully',
      });

      queryClient.invalidateQueries(['Divisions', division.district]);
      closeModal();
    } catch (err) {
      console.log('RAW ERROR:', err);
      console.log('MESSAGE:', err?.message);
      // 🔥 silent no-op handling
      if (err?.message === 'NO_CHANGES_DETECTED') {
        closeModal(); // silent exit
        return;
      }

      let text1 = 'Error';
      let text2 = 'Failed to update division';
      let type = 'error';

      switch (err?.message) {
        case 'TOP_TIER_PROMOTION_MODIFICATION_NOT_ALLOWED':
          type = 'info';
          text1 = 'Update Not Allowed';
          text2 = 'Cannot modify promotion spots for top tier division';
          break;

        case 'BOTTOM_TIER_RELEGATION_MODIFICATION_NOT_ALLOWED':
          type = 'info';
          text1 = 'Update Not Allowed';
          text2 = 'Cannot modify relegation spots for bottom tier division';
          break;

        case 'MAX_COMPETITORS_BELOW_ACTIVE_MEMBERS':
          type = 'info';
          text1 = 'Invalid Max Competitors';
          text2 =
            'Max competitors cannot be less than the number of active competitors in this division';
          break;

        case 'DIVISION_NOT_FOUND':
          type = 'error';
          text1 = 'Error';
          text2 = 'Division not found';
          break;
      }

      Toast.show({
        type: type,
        text1: text1,
        text2: text2,
      });
    } finally {
      closeModal();
    }
  };

  return (
    <View className="flex-1 gap-4 p-5 pb-16 pt-0">
      <ScrollView contentContainerStyle={{ gap: 16 }} className="flex-1 gap-4 pt-5">
        <CustomTextInput
          value={name}
          onChangeText={setName}
          title="Division Name"
          placeholder="e.g. Super League"
          className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
          leftIconName="trophy-outline"
          iconColor="purple"
          autoCapitalize="words"
          titleColor="text-text-1"
        />
        <CustomTextInput
          value={groupName}
          onChangeText={setGroupName}
          title="Group Name"
          placeholder="e.g. Thursday Teams"
          className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
          leftIconName="layers-outline"
          iconColor="purple"
          autoCapitalize="words"
          titleColor="text-text-1"
        />
        <CustomTextInput
          value={maxCompetitors}
          onChangeText={setMaxCompetitors}
          title="Max Competitors"
          keyboardType="numeric"
          placeholder="e.g. 20"
          className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
          leftIconName="people-outline"
          iconColor="purple"
          autoCapitalize="words"
          titleColor="text-text-1"
        />
        <View className="flex-row items-center gap-4">
          <View className="flex-1">
            <CustomTextInput
              title="Promotions"
              value={promotions}
              onChangeText={setPromotions}
              keyboardType="numeric"
              titleColor="text-text-1"
              placeholder="e.g. 3"
              leftIconName="caret-up-outline"
              iconColor="#34C757"
              clearButtonMode="never"
            />
          </View>
          <View className="flex-1">
            <CustomTextInput
              value={relegations}
              onChangeText={setRelegations}
              title="Relegations"
              placeholder="e.g. 3"
              iconColor="#FF3B30"
              leftIconName="caret-down-outline"
              titleColor="text-text-1"
              keyboardType="numeric"
              clearButtonMode="never"
            />
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 p-3">
          <View className="flex-1 items-start justify-center gap-1">
            <Text className="font-saira-medium text-xl text-text-1">Mid-Season Transfers</Text>
            <Text className="font-saira text-xs text-text-2">
              If disabled, players will not be able to join teams in this division after the season
              has started.
            </Text>
          </View>
          <Switch
            className="w-16"
            value={midSeasonTransfers}
            onValueChange={setMidSeasonTransfers}
            trackColor={{ false: '#E5E7EB', true: '#800080' }}
            thumbColor={midSeasonTransfers ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 p-3">
          <View className="flex-1 items-start justify-center gap-1">
            <Text className="font-saira-medium text-xl text-text-1">Admin Approval Required</Text>
            <Text className="font-saira text-xs text-text-2">
              If enabled, all join requests for teams in this division will require admin approval.
            </Text>
          </View>
          <Switch
            className="w-16"
            value={adminApprovalRequired}
            onValueChange={setAdminApprovalRequired}
            trackColor={{ false: '#E5E7EB', true: '#800080' }}
            thumbColor={adminApprovalRequired ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </ScrollView>
      <CTAButton type="yellow" text="Save Changes" callbackFn={handleSave} />
    </View>
  );
};

export default EditDivisionForm;
