import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import CTAButton from '@components/CTAButton';
import { useState } from 'react';
import CustomTextInput from '@components/CustomTextInput';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

const Requirements = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [compName, setCompName] = useState('');
  const [competitorType, setCompetitorType] = useState(null); // 'team' or 'individual'
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');

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
    router.push({
      pathname: '/competitions/create-blueprint/competition-rules',
      params: { ...params, competitorType, compName, minAge, maxAge, gender },
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
            paddingBottom: 60,
          }}
          className="mt-16 flex-1 bg-brand px-4">
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
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 ${
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
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 ${
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
          <View className="gap-3">
            <View className="flex-row gap-5">
              <Pressable
                onPress={() => (gender === 'male' ? setGender(null) : setGender('male'))}
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 ${
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
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 ${
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
            <Text className="px-2 font-saira text-xs text-text-on-brand-2">
              Set the gender requirement for the competition (optional). Leave unselected for mixed
              competitions.
            </Text>
          </View>
          <CTAButton text="Continue" type="yellow" callbackFn={handleContinue} />
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default Requirements;
