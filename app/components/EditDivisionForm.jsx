import { View, Text, Switch } from 'react-native';
import { useState } from 'react';
import CustomTextInput from './CustomTextInput';
import { max } from 'lodash';
import CTAButton from './CTAButton';

const EditDivisionForm = () => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [maxCompetitors, setMaxCompetitors] = useState('');
  const [midSeasonTransfers, setMidSeasonTransfers] = useState(false);
  const [adminApprovalRequired, setAdminApprovalRequired] = useState(false);
  return (
    <View className="flex-1 gap-4">
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
      <CTAButton type="yellow" text="Save Changes" callbackFn={() => {}} />
    </View>
  );
};

export default EditDivisionForm;
