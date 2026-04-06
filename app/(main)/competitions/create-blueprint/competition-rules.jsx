import { StyleSheet, View, Text, Pressable, Image, Switch } from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import CTAButton from '@components/CTAButton';
import { useState } from 'react';
import CustomTextInput from '@components/CustomTextInput';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { StackActions } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@contexts/UserProvider';

const CompetitionRules = () => {
  const { currentRole } = useUser();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const [maxCompetitors, setMaxCompetitors] = useState('');
  const [consolationMatch, setConsolationMatch] = useState(false);
  const [legs, setLegs] = useState('1');
  const [bracketGeneration, setBracketGeneration] = useState(null); // 'random', 'fixed'
  const [bestOf, setBestOf] = useState('');
  const [byeRounds, setByeRounds] = useState(true);
  const [loading, setLoading] = useState(false);

  console.log('Received params in CompetitionRules:', params);

  const handleContinue = async () => {
    if (!bracketGeneration) {
      Toast.show({
        type: 'info',
        text1: 'Bracket Generation Method Required',
        text2: 'Please select a bracket generation method before continuing.',
      });
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('Competitions').insert({
        district_id: currentRole?.district?.id,
        name: params.compName,
        competitor_type: params.competitorType,
        competition_type: params.competitionType,
        min_age: params.minAge ? parseInt(params.minAge) : null,
        max_age: params.maxAge ? parseInt(params.maxAge) : null,
        gender: params.gender ? params.gender : 'mixed',
        division_id: params.division,
        max_competitors: maxCompetitors ? parseInt(maxCompetitors) : null,
        bracket_generation: bracketGeneration,
        legs: legs ? parseInt(legs) : 1,
        best_of: bestOf ? parseInt(bestOf) : null,
        auto_bye_rounds: byeRounds,
        consolation_match: consolationMatch,
      });

      if (error) {
        throw error; // 👈 force it into catch
      }

      queryClient.invalidateQueries(['Competitions', currentRole?.district?.id]);
      // Reset stack to /competitions
      navigation.dispatch(StackActions.replace('competitions'));
      Toast.show({
        type: 'success',
        text1: 'Competition Created',
        text2: 'Your competition blueprint has been successfully created.',
      });
    } catch (error) {
      console.error('Error creating competition:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while creating the competition. Please try again.',
      });
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title="Configure Rules" />
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
            gap: 12,
            paddingTop: 20,
            paddingBottom: 60,
          }}
          className="mt-16 flex-1 bg-brand px-4">
          <View className="gap-1">
            <CustomTextInput
              title={`Max No. of ${params.competitorType === 'team' ? 'Teams' : 'Players'}`}
              value={maxCompetitors}
              onChangeText={setMaxCompetitors}
              keyboardType="numeric"
              placeholder="e.g. 16 or 32"
              leftIconName="people"
              maxLength={3}
              iconColor="#800080" //purple
              clearButtonMode="never"
            />
            <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
              Set the maximum number of competitors allowed in the competition. Leave blank for no
              limit.
            </Text>
          </View>
          <View className="gap-1">
            <Text className="px-2 font-saira-medium text-xl text-text-on-brand">
              Bracket Generation Method
            </Text>
            <View className="flex-row gap-5">
              <Pressable
                onPress={() => setBracketGeneration('random')}
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                  bracketGeneration === 'random' ? 'border-theme-orange' : 'border-transparent'
                }`}>
                <Ionicons name="help" size={28} color="#FFA500" />
                <Text className="font-saira-medium text-lg text-text-1">Random</Text>
                {bracketGeneration === 'random' && (
                  <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-orange">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => setBracketGeneration('fixed')}
                className={`flex-1 flex-row items-center gap-3 rounded-xl border-2 bg-bg-1 p-4 py-3 ${
                  bracketGeneration === 'fixed' ? 'border-theme-purple' : 'border-transparent'
                }`}>
                <Ionicons name="lock-closed-outline" size={24} color="#800080" />
                <Text className="font-saira-medium text-lg text-text-1">Fixed</Text>
                {bracketGeneration === 'fixed' && (
                  <View className="ml-auto h-6 w-6 items-center justify-center rounded-full bg-theme-purple">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </Pressable>
            </View>
            <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
              Random: Fixtures are generated randomly after each round. Fixed: All fixtures are
              generated in brackets at the start of the competition.
            </Text>
          </View>
          <View className="gap-1">
            <CustomTextInput
              title="Legs per Round"
              value={legs}
              onChangeText={setLegs}
              keyboardType="numeric"
              placeholder="e.g. 1 or 2"
              leftIconName="repeat"
              maxLength={1}
              maximumValue={2}
              iconColor="#800080" //purple
              clearButtonMode="never"
            />
            <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
              If multiple legs are played, then aggregate scoring will be used to determine the
              winner of each fixture.
            </Text>
          </View>

          <View className="gap-1">
            <CustomTextInput
              title="Best of X Frames"
              value={bestOf}
              onChangeText={(text) => {
                if (text === '' || (parseInt(text) > 0 && parseInt(text) % 2 === 1)) {
                  setBestOf(text);
                }
              }}
              keyboardType="numeric"
              placeholder="e.g. 5 or 7"
              leftIconName="layers-outline"
              maxLength={2}
              iconColor="#800080" //purple
              clearButtonMode="never"
            />
            <Text className="px-2 pt-2 font-saira text-xs text-text-on-brand-2">
              If specified, each fixture will be played as best of X frames. Must be an odd number
              (e.g. 3, 5, 7).
            </Text>
          </View>

          <View className="gap-4">
            {/* Bye Rounds */}
            <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 p-3">
              <View className="flex-1 items-start justify-center gap-1">
                <Text className="font-saira-medium text-xl text-text-1">Auto-byes</Text>
                <Text className="font-saira text-xs text-text-2">
                  If disabled, the admin will be responsible for manually assigning byes.
                </Text>
              </View>
              <Switch
                className="w-16"
                value={byeRounds}
                onValueChange={setByeRounds}
                trackColor={{ false: '#E5E7EB', true: '#800080' }}
                thumbColor={byeRounds ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {/* Consolation Match */}
            <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 p-3">
              <View className="flex-1 items-start justify-center gap-1">
                <Text className="font-saira-medium text-xl text-text-1">Consolation Match</Text>

                <Text className="font-saira text-xs text-text-2">
                  If enabled, a match will be played for 3rd place.
                </Text>
              </View>
              <Switch
                className="w-16"
                value={consolationMatch}
                onValueChange={setConsolationMatch}
                trackColor={{ false: '#E5E7EB', true: '#800080' }}
                thumbColor={consolationMatch ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>

          <CTAButton text="Continue" type="yellow" callbackFn={handleContinue} />
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default CompetitionRules;
