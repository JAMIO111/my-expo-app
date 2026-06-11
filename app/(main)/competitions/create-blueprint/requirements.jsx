import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import CTAButton from '@components/CTAButton';
import { useState, useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';
import CustomTextInput from '@components/CustomTextInput';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import CustomDropdown from '@components/CustomDropdown';

const Requirements = () => {
  const { currentRole } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [compName, setCompName] = useState('');
  const [competitorType, setCompetitorType] = useState(null); // 'team' or 'individual'
  const [teamType, setTeamType] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');
  const [division, setDivision] = useState(null);
  const [maxTeamSize, setMaxTeamSize] = useState('');
  const [minTeamSize, setMinTeamSize] = useState('');

  console.log('Selected Division:', division);

  useEffect(() => {
    setDivision(null);
  }, [competitorType]);

  const formattedDivisions =
    currentRole?.divisions
      ?.filter((div) => div.competitor_type === competitorType)
      ?.sort((a, b) => {
        // first by group_id ascending
        if ((a.group_id ?? 0) !== (b.group_id ?? 0)) return (a.group_id ?? 0) - (b.group_id ?? 0);
        // then by tier ascending
        return a.tier - b.tier;
      })
      .map((div) => ({
        label: div.name,
        subLabel: `Tier ${div.tier}${div.group_id ? ` - ${div.group_name}` : ''}`,
        value: div.id,
      })) ?? [];

  const handleContinue = () => {
    if (!compName.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Competition Name Required',
        text2: 'Please enter a name for the competition.',
      });
      return;
    }
    if (!competitorType) {
      Toast.show({
        type: 'info',
        text1: 'Competitor Type Required',
        text2: 'Please select a competitor type for the competition.',
      });
      return;
    }
    if (competitorType === 'team' && !teamType) {
      Toast.show({
        type: 'info',
        text1: 'Team Type Required',
        text2: 'Please select a team type for the competition.',
      });
      return;
    }
    if (
      competitorType === 'team' &&
      teamType === 'child' &&
      (!maxTeamSize || parseInt(maxTeamSize) < 2)
    ) {
      Toast.show({
        type: 'info',
        text1: 'Invalid Team Size',
        text2: 'Please enter a valid maximum team size (at least 2).',
      });
      return;
    }
    if (
      competitorType === 'team' &&
      teamType === 'child' &&
      minTeamSize &&
      (parseInt(minTeamSize) < 2 || parseInt(minTeamSize) > parseInt(maxTeamSize))
    ) {
      Toast.show({
        type: 'info',
        text1: 'Invalid Team Size',
        text2:
          'Please enter a valid minimum team size (at least 2 and not greater than the maximum team size).',
      });
      return;
    }
    router.push({
      pathname: '/competitions/create-blueprint/create-competition-rules',
      params: {
        ...params,
        competitorType,
        teamType: competitorType === 'team' ? teamType : null,
        compName,
        minAge,
        maxAge,
        maxTeamSize: competitorType === 'team' && teamType === 'child' ? maxTeamSize : null,
        minTeamSize: competitorType === 'team' && teamType === 'child' ? minTeamSize : null,
        gender,
        division,
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title="Entry Requirements" />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={{
            display: 'flex',
            flexGrow: 1,
            gap: 20,
            paddingTop: 20,
            paddingBottom: 160,
          }}
          className="mt-16 flex-1 bg-brand-dark px-4">
          <CustomTextInput
            placeholder="e.g. Northern Cup"
            title="Competition Name"
            titleColor="text-text-on-brand"
            leftIconName="trophy"
            iconColor="orange"
            value={compName}
            onChangeText={setCompName}
            autoCapitalize="words"
            returnKeyType="done"
          />
          <View className="gap-1">
            <Text className="px-2 font-saira-medium text-xl text-text-on-brand">
              Competitor Type
            </Text>
            <View className="flex-row gap-5">
              <Pressable
                onPress={() => setCompetitorType('team')}
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                  competitorType === 'team' ? 'border-theme-orange' : 'border-transparent'
                }`}>
                <Ionicons name="people" size={24} color="#FFA500" />
                <Text className="font-saira-medium text-lg text-text-1">Team</Text>
                {competitorType === 'team' && (
                  <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-orange">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => setCompetitorType('individual')}
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                  competitorType === 'individual' ? 'border-theme-purple' : 'border-transparent'
                }`}>
                <Ionicons name="person" size={24} color="#800080" />
                <Text className="font-saira-medium text-lg text-text-1">Individual</Text>
                {competitorType === 'individual' && (
                  <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-purple">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </Pressable>
            </View>
            <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
              This is for fixture categorisation, not individual frames. Everything other than
              singles will come under team.
            </Text>
          </View>
          {competitorType === 'team' && (
            <View className="gap-6">
              <View className="gap-1">
                <Text className="px-2 font-saira-medium text-xl text-text-on-brand">Team Type</Text>
                <View className="flex-row gap-5">
                  <Pressable
                    onPress={() => setTeamType('parent')}
                    className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                      teamType === 'parent' ? 'border-[#007AFF]' : 'border-transparent'
                    }`}>
                    <Ionicons name="globe-outline" size={24} color="#007AFF" />
                    <Text className="font-saira-medium text-lg text-text-1">Parent</Text>
                    {teamType === 'parent' && (
                      <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-[#007AFF]">
                        <Ionicons name="checkmark" size={14} color="white" />
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => setTeamType('child')}
                    className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                      teamType === 'child' ? 'border-theme-red' : 'border-transparent'
                    }`}>
                    <Ionicons name="medal" size={24} color="#FF0000" />
                    <Text className="font-saira-medium text-lg text-text-1">Child</Text>
                    {teamType === 'child' && (
                      <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-red">
                        <Ionicons name="checkmark" size={14} color="white" />
                      </View>
                    )}
                  </Pressable>
                </View>
                <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
                  'Parent' enters the full parent team into the competition, whereas 'Child' allows
                  multiple teams from the same parent team to compete (e.g. Doubles, Trebles).
                </Text>
              </View>
              {teamType === 'child' && (
                <View className="gap-1">
                  <View className="flex-1 flex-row justify-between gap-5">
                    <View className="flex-1">
                      <CustomTextInput
                        title="Minimum Team Size"
                        value={minTeamSize}
                        onChangeText={setMinTeamSize}
                        keyboardType="numeric"
                        placeholder="e.g. 2"
                        leftIconName="people"
                        iconColor="#FFA500"
                        clearButtonMode="never"
                      />
                    </View>
                    <View className="flex-1">
                      <CustomTextInput
                        title="Maximum Team Size"
                        value={maxTeamSize}
                        onChangeText={setMaxTeamSize}
                        keyboardType="numeric"
                        placeholder="e.g. 4"
                        leftIconName="people"
                        iconColor="#FFA500"
                        clearButtonMode="never"
                      />
                    </View>
                  </View>
                  <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
                    For child teams, specify the minimum and maximum team size (e.g. 2 for doubles,
                    3 for trebles). If you want to allow additional reserve players please account
                    for this.
                  </Text>
                </View>
              )}
            </View>
          )}
          <View className="gap-3">
            <View className="flex-row gap-5">
              <View className="flex-1">
                <CustomTextInput
                  title="Minimum Age"
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="numeric"
                  placeholder="e.g. 50"
                  leftIconName="caret-up-outline"
                  iconColor="#34C757"
                  clearButtonMode="never"
                />
              </View>
              <View className="flex-1">
                <CustomTextInput
                  value={maxAge}
                  onChangeText={setMaxAge}
                  title="Maximum Age"
                  placeholder="e.g. 18"
                  iconColor="#FF3B30"
                  leftIconName="caret-down-outline"
                  keyboardType="numeric"
                  clearButtonMode="never"
                />
              </View>
            </View>
            <Text className="px-2 font-saira text-xs text-text-on-brand-2">
              Set the age limits for the competition (optional). For overs competitions, set the
              minimum age. For youth competitions, set the maximum age.
            </Text>
          </View>
          <View className="gap-1">
            <Text className="px-2 font-saira-medium text-xl text-text-on-brand">
              Gender Requirement
            </Text>
            <View className="flex-row gap-5">
              <Pressable
                onPress={() => (gender === 'male' ? setGender(null) : setGender('male'))}
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                  gender === 'male' ? 'border-theme-blue' : 'border-transparent'
                }`}>
                <Ionicons name="male" size={24} color="#007AFF" />
                <Text className="font-saira-medium text-lg text-text-1">Male</Text>
                {gender === 'male' && (
                  <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-blue">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => (gender === 'female' ? setGender(null) : setGender('female'))}
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                  gender === 'female' ? 'border-theme-pink' : 'border-transparent'
                }`}>
                <Ionicons name="female" size={24} color="#FF2D55" />
                <Text className="font-saira-medium text-lg text-text-1">Female</Text>
                {gender === 'female' && (
                  <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-pink">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </Pressable>
            </View>
            <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
              Set the gender requirement for the competition (optional). Leave unselected for mixed
              competitions.
            </Text>
          </View>
          <View className="gap-3">
            <CustomDropdown
              title="Division Requirement"
              leftIconName="ribbon"
              iconColor="purple"
              placeholder={
                competitorType ? 'Select division (optional)' : 'Select competitor type first'
              }
              value={division}
              onChange={setDivision}
              options={formattedDivisions}
              disabled={!competitorType}
            />
            <Text className="px-2 font-saira text-xs text-text-on-brand-2">
              {`Only ${competitorType === 'individual' ? 'individuals' : 'teams'} in this division will be able to enter. Leave unselected for open competitions.`}
            </Text>
          </View>
        </ScrollView>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} className="p-6">
          <View
            style={{ borderRadius: 30 }}
            className="border border-theme-gray-3 bg-bg-1/70 p-4 shadow-md backdrop-blur-lg">
            <CTAButton text="Continue" type="yellow" callbackFn={handleContinue} />
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default Requirements;
