import { StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { supabase } from '@/lib/supabase';
import CrestEditor from '@components/CrestEditor';
import { useColorScheme } from 'react-native';

const TeamCrest = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');

  console.log('TeamCrest league param:', league);

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

    if (!name) {
      alert('Team name cannot be blank');
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

    const abbrExists = teams.some((t) => t.abbreviation?.toUpperCase() === abbr);

    if (abbrExists) {
      alert('That team abbreviation is already taken');
      return;
    }

    router.push({
      pathname: '/(main)/onboarding/profile-claim',
      params: {
        teamDetails: JSON.stringify({ name, abbreviation: abbr }),
        teams: JSON.stringify(teams),
        league: params.league,
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 4 of 4',
        }}
      />
      <SafeViewWrapper
        useTopInset={false}
        useBottomInset={false}
        topColor="bg-brand"
        bottomColor="bg-brand-dark">
        <View className={`flex-1 justify-between gap-3 bg-brand`}>
          <StepPillGroup steps={4} currentStep={4} />
          <View className="flex-1 gap-3">
            <Text
              style={{ lineHeight: 40 }}
              className={`p-3 font-delagothic text-4xl font-bold text-text-on-brand`}>
              Create your team crest.
            </Text>
            <CrestEditor buttonText="Save & Continue" handleSave={handleContinue} />
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamCrest;

const styles = StyleSheet.create({});
