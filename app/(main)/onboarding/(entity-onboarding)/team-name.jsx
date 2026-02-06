import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { supabase } from '@/lib/supabase';
import CustomTextInput from '@components/CustomTextInput';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';

const TeamName = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamAbbreviation, setTeamAbbreviation] = useState('');
  const [teamDisplayName, setTeamDisplayName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  console.log('TeamName league param:', league);

  useEffect(() => {
    if (!league?.id) return;

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('Districts')
        .select(
          `
        id,
        Divisions (
          id,
          name,
          tier,
          Teams (
            id,
            name,
            display_name,
            abbreviation,
            crest,
            status,
            division
          )
        )
      `
        )
        .eq('id', league.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      const teams = data.Divisions.flatMap((d) => d.Teams);
      setTeams(teams);
    };

    fetchData();
  }, [league?.id]);

  const handleContinue = () => {
    const name = teamName.trim();
    const abbr = teamAbbreviation.trim().toUpperCase();
    const displayName = teamDisplayName.trim();

    if (!name) {
      Toast.show({
        type: 'error',
        text1: 'Team name cannot be blank',
      });
      return;
    }

    if (!displayName) {
      Toast.show({
        type: 'error',
        text1: 'Display name cannot be blank',
      });
      return;
    }

    if (!abbr) {
      Toast.show({
        type: 'error',
        text1: 'Team abbreviation cannot be blank',
      });
      return;
    }

    if (abbr.length !== 3) {
      Toast.show({
        type: 'error',
        text1: 'Team abbreviation must be 3 characters long.',
      });
      return;
    }

    const nameExists = teams.some((t) => t.name.toLowerCase() === name.toLowerCase());

    if (nameExists) {
      Toast.show({
        type: 'error',
        text1: 'Team name already in use',
        text2: 'Another team in this league already uses this name. Please choose a different one.',
      });
      return;
    }

    const displayNameExists = teams.some(
      (t) => t.display_name.toLowerCase() === displayName.toLowerCase()
    );

    if (displayNameExists) {
      Toast.show({
        type: 'error',
        text1: 'Display name already in use',
        text2:
          'Another team in this league already uses this display name. Please choose a different one.',
      });
      return;
    }

    const abbrExists = teams.some((t) => t.abbreviation?.toUpperCase() === abbr);

    if (abbrExists) {
      Toast.show({
        type: 'error',
        text1: 'Team abbreviation already in use',
        text2:
          'Another team in this league already uses this abbreviation. Please choose a different one.',
      });
      return;
    }

    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/team-crest',
      params: {
        teamDetails: JSON.stringify({
          name,
          display_name: displayName,
          abbreviation: abbr,
          is_private: isPrivate,
        }),
        teams: JSON.stringify(teams),
        league: params.league,
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 2 of 6',
        }}
      />
      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-brand-dark">
        <View className="flex-1 justify-between gap-3 bg-brand">
          <StepPillGroup steps={6} currentStep={2} />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100} // adjust if header exists
          >
            <ScrollView className="flex-1 gap-3 p-5">
              <Text
                style={{ lineHeight: 40 }}
                className="mb-4 font-delagothic text-4xl font-bold text-text-on-brand">
                Create a team in the {league?.name || 'Unnamed League'} league?
              </Text>
              <Text className="font-saira-medium text-xl text-text-on-brand-2">
                Please enter your team name, display name, and 3 letter abbreviation below.
              </Text>
              <View className="mt-4 gap-4">
                <CustomTextInput
                  value={teamName}
                  onChangeText={setTeamName}
                  title="Team Name"
                  placeholder="e.g. Newsham Victoria A"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="create-outline"
                  iconColor="#A259FF"
                  autoCapitalize="words"
                />
                <CustomTextInput
                  value={teamDisplayName}
                  onChangeText={setTeamDisplayName}
                  title="Team Display Name"
                  placeholder="e.g. Newsham Vic A"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="create-outline"
                  iconColor="#A259FF"
                  autoCapitalize="words"
                />
                <CustomTextInput
                  value={teamAbbreviation}
                  onChangeText={setTeamAbbreviation}
                  title="Team Abbreviation"
                  placeholder="e.g. NVA"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="pricetag-outline"
                  iconColor="#A259FF"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={3}
                />
                <View className="my-5 gap-2">
                  <View className="h-16 flex-row items-center gap-5 rounded-xl border border-theme-gray-4 bg-bg-grouped-2 pr-5">
                    <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
                      <Ionicons name="lock-closed-outline" size={26} color="#A259FF" />
                    </View>
                    <Text className="flex-1 font-saira-medium text-xl text-text-1">
                      Private Team
                    </Text>
                    <Switch
                      value={isPrivate}
                      onValueChange={setIsPrivate}
                      thumbColor="white"
                      trackColor={{
                        false: 'gray',
                        true: '#4CAF50',
                      }}
                    />
                  </View>
                  <Text className="mt-2 px-2 text-text-on-brand-2">
                    This setting controls whether players can request to join the team or see it in
                    search results. You can change this setting later if you're not sure right now.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pt-6">
            <CTAButton callbackFn={() => router.back()} type="error" text="Go Back" />
            <CTAButton type="yellow" text="Continue" callbackFn={handleContinue} />
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamName;

const styles = StyleSheet.create({});
