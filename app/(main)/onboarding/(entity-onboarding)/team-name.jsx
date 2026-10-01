import { StyleSheet, Text, View, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { supabase } from '@/lib/supabase';
import CustomTextInput from '@components/CustomTextInput';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';
import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeamName = () => {
  useOnboardingStep(2, 6);
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamAbbreviation, setTeamAbbreviation] = useState('');
  const [teamDisplayName, setTeamDisplayName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

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

      const teams = data.Divisions.flatMap((d) => d.Teams).filter((t) => t.status !== 'cancelled');
      setTeams(teams);
    };

    fetchData();
  }, [league?.id]);

  const handleContinue = () => {
    const name = teamName.trim();
    const abbr = teamAbbreviation.trim().toUpperCase();
    const displayName = teamDisplayName.trim();

    if (name.length < 3 || name.length > 60) {
      Toast.show({
        type: 'error',
        text1: 'Team name must be 3 to 60 characters',
      });
      return;
    }

    if (displayName.length < 2 || displayName.length > 40) {
      Toast.show({
        type: 'error',
        text1: 'Display name must be 2 to 40 characters',
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

    if (!/^[A-Z0-9]{3}$/.test(abbr)) {
      Toast.show({
        type: 'error',
        text1: 'Team abbreviation must be 3 letters or numbers.',
      });
      return;
    }

    const nameExists = teams.some((t) => t.name?.toLowerCase() === name.toLowerCase());

    if (nameExists) {
      Toast.show({
        type: 'error',
        text1: 'Team name already in use',
        text2: 'Another team in this league already uses this name. Please choose a different one.',
      });
      return;
    }

    const displayNameExists = teams.some(
      (t) => t.display_name?.toLowerCase() === displayName.toLowerCase()
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

  const abbrRef = useRef(null);
  const displayRef = useRef(null);

  return (
    <OnboardingScreen
      title={`Create a team in ${league?.name || 'your league'}`}
      subtitle="Choose a name, a shorter display name and a 3-letter abbreviation."
      onCta={handleContinue}
      ctaDisabled={!teamName.trim() || !teamDisplayName.trim() || teamAbbreviation.trim().length !== 3}>
      <View className="gap-6">
        <OnboardingInput
          label="Full team name"
          icon="create-outline"
          placeholder="e.g. Newsham Victoria A"
          value={teamName}
          onChangeText={setTeamName}
          autoCapitalize="words"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => displayRef.current?.focus()}
        />
        <OnboardingInput
          ref={displayRef}
          delay={70}
          label="Display name"
          icon="text-outline"
          placeholder="e.g. Newsham Vic A"
          value={teamDisplayName}
          onChangeText={setTeamDisplayName}
          autoCapitalize="words"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => abbrRef.current?.focus()}
          hint="Shown on fixtures and tables where space is tight."
        />
        <OnboardingInput
          ref={abbrRef}
          delay={140}
          label="Abbreviation"
          icon="pricetag-outline"
          placeholder="e.g. NVA"
          value={teamAbbreviation}
          onChangeText={(t) => setTeamAbbreviation(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={3}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
        <ToggleCard
          delay={210}
          icon="lock-closed-outline"
          title="Private team"
          value={isPrivate}
          onValueChange={setIsPrivate}
          description="When on, you (the captain) approve every player who asks to join."
        />
      </View>
    </OnboardingScreen>
  );
};

export default TeamName;
