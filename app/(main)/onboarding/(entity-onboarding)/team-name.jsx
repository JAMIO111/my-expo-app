import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { supabase } from '@/lib/supabase';
import CustomTextInput from '@components/CustomTextInput';

const TeamName = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamAbbreviation, setTeamAbbreviation] = useState('');
  const [teamDisplayName, setTeamDisplayName] = useState('');

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
          Teams (
            id,
            name,
            display_name,
            abbreviation,
            crest
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
      alert('Team name cannot be blank');
      return;
    }

    if (!displayName) {
      alert('Display name cannot be blank');
      return;
    }

    if (!abbr) {
      alert('Team abbreviation cannot be blank');
      return;
    }

    if (abbr.length !== 3) {
      alert('Team abbreviation must be 3 letters');
      return;
    }

    const nameExists = teams.some((t) => t.name.toLowerCase() === name.toLowerCase());

    if (nameExists) {
      alert('A team with this name already exists in this league');
      return;
    }

    const displayNameExists = teams.some(
      (t) => t.display_name.toLowerCase() === displayName.toLowerCase()
    );

    if (displayNameExists) {
      alert('A team with this display name already exists in this league');
      return;
    }

    const abbrExists = teams.some((t) => t.abbreviation?.toUpperCase() === abbr);

    if (abbrExists) {
      alert('That team abbreviation is already taken');
      return;
    }

    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/team-crest',
      params: {
        teamDetails: JSON.stringify({
          name,
          display_name: displayName,
          abbreviation: abbr,
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
          title: 'Step 3 of 4',
        }}
      />
      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-brand-dark">
        <View className="flex-1 justify-between gap-3 bg-brand">
          <StepPillGroup steps={4} currentStep={3} />
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
                  titleColor="text-text-1"
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
                  titleColor="text-text-1"
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
                  titleColor="text-text-1"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={3}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pt-6">
            <CTAButton callbackFn={() => router.back()} type="error" text="Go Back" />
            <View>
              <CTAButton type="yellow" text="Continue" callbackFn={handleContinue} />
              <Text className="px-3 text-lg text-text-2"></Text>
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamName;

const styles = StyleSheet.create({});
