import { Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import CodeInput from '@components/onboarding/CodeInput';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useUser } from '@contexts/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';

const UniqueCode = () => {
  const queryClient = useQueryClient();
  const { player } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isNewTeam = params.isNewTeam === 'true'; // Convert string to boolean
  const isNewLeague = params.isNewLeague === 'true'; // Convert string to boolean
  useOnboardingStep(1, isNewTeam ? 6 : isNewLeague ? 4 : 3);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const codeRef = useRef(null);

  const fail = () => {
    setHasError(true);
    codeRef.current?.shake();
    setTimeout(() => {
      setHasError(false);
      setCode('');
      codeRef.current?.focus();
    }, 700);
  };

  const onChangeCode = (value) => {
    setHasError(false);
    setCode(value);
  };

  const handleCreateLeague = async () => {
    setIsLoading(true);

    try {
      if (code.length !== 6) {
        throw new Error('INVALID_CODE');
      }

      // One checked RPC: finds the league by its admin code and either locks a new league
      // for this player to set up, or (for an active league) makes them an admin.
      const { data: claim, error: claimError } = await supabase.rpc('claim_district_by_code', {
        p_code: code,
      });

      if (claimError) {
        const detail = claimError.details;
        if (detail === 'invalid_code') throw new Error('INVALID_CODE');
        if (detail === 'league_not_found') throw new Error('LEAGUE_NOT_FOUND');
        if (detail === 'league_locked') throw new Error('LEAGUE_LOCKED');
        throw new Error('ADMIN_FLOW_FAILED');
      }

      // 🆕 NEW LEAGUE → locked for this player → set it up
      if (claim.status === 'lock_acquired') {
        router.replace({
          pathname: '/(main)/onboarding/(entity-onboarding)/district-name',
          params: { districtId: claim.district_id },
        });
        return;
      }

      // ✅ ACTIVE → this player is now an admin of the league. The server has moved them on, so just
      // refresh their profile and the layout takes them to their new role.
      if (claim.status === 'joined') {
        Toast.show({
          type: 'success',
          text1: 'Admin Access Granted',
          text2: `You are now an admin for ${claim.district_name}.`,
        });
        await queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
        return;
      }
    } catch (err) {
      // 🎯 Centralised error handling
      let message = {
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Please try again.',
      };

      switch (err.message) {
        case 'INVALID_CODE':
          message = {
            type: 'error',
            text1: 'Invalid Code',
            text2: 'Please enter a valid 6-digit code.',
          };
          codeRef.current?.focus();
          break;

        case 'LEAGUE_NOT_FOUND':
          message = {
            type: 'error',
            text1: 'Invalid League Code',
            text2: 'Please check the code and try again.',
          };
          break;

        case 'LOCK_FAILED':
          message = {
            type: 'error',
            text1: 'Failed to lock league',
            text2: 'Please try again.',
          };
          break;

        case 'LEAGUE_LOCKED':
          message = {
            type: 'info',
            text1: 'League is locked',
            text2:
              'This league is currently being set up by another admin. Please check back soon.',
          };
          break;

        case 'ADMIN_FLOW_FAILED':
          message = {
            type: 'error',
            text1: 'Oops - something went wrong',
            text2: 'Could not grant admin access. Try again.',
          };
          break;
      }

      Toast.show(message);
      fail();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a valid 6-digit code.',
      });
      codeRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      // The league's team sign-up code (not its admin code), checked on the server.
      const { data: LeagueData, error } = await supabase.rpc('find_league_by_code', { p_code: code });
      if (error) throw error;

      router.push({
        pathname: '/(main)/onboarding/(entity-onboarding)/team-name',
        params: { league: JSON.stringify(LeagueData) },
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'League could not be found',
        text2: 'Please check the code and try again.',
      });
      fail();
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a valid 6-digit code.',
      });
      codeRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const { data: TeamData, error } = await supabase.rpc('find_team_by_code', { p_code: code });
      if (error) throw error;

      router.push({
        pathname: '/(main)/onboarding/(entity-onboarding)/team-confirm',
        params: { team: JSON.stringify(TeamData) },
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Team could not be found',
        text2: 'Please check the code and try again.',
      });
      fail();
    } finally {
      setIsLoading(false);
    }
  };

  const copy = isNewLeague
    ? {
        title: 'Enter your access code',
        subtitle: 'The app administrator should have given you a 6-digit code.',
        cta: 'Get started',
        help: 'No code yet? Ask the app administrator.',
      }
    : isNewTeam
      ? {
          title: 'Enter your league code',
          subtitle: "Your league official has a 6-digit code that finds your league.",
          cta: 'Find league',
          help: 'No code? Ask your league official for the team sign-up code.',
        }
      : {
          title: 'Enter your team code',
          subtitle: 'Your team captain has a 6-digit code that finds your team.',
          cta: 'Find team',
          help: 'No code? Ask your team captain, it is shown on their team page.',
        };

  const submit = isNewLeague ? handleCreateLeague : isNewTeam ? handleCreateTeam : handleJoinTeam;
  const complete = code.length === 6;

  return (
    <OnboardingScreen
      title={copy.title}
      subtitle={copy.subtitle}
      ctaText={isLoading ? 'Checking…' : copy.cta}
      onCta={submit}
      ctaDisabled={!complete || isLoading}
      ctaLoading={isLoading}>
      <View className="gap-8 pt-2">
        <Animated.View entering={FadeInDown.duration(380)}>
          <CodeInput
            ref={codeRef}
            value={code}
            onChange={onChangeCode}
            disabled={isLoading}
            error={hasError}
          />
          <Text
            className={`mt-4 text-center font-saira text-base ${hasError ? 'text-red-300' : 'text-text-on-brand-2'}`}>
            {hasError ? "That code didn't work" : `${code.length} of 6 digits`}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(380)}
          className="flex-row items-center gap-3 rounded-2xl bg-white/10 p-4">
          <Ionicons name="help-circle-outline" size={22} color="#FFFFFFAA" />
          <Text className="flex-1 font-saira text-base text-text-on-brand-2">{copy.help}</Text>
        </Animated.View>
      </View>
    </OnboardingScreen>
  );
};

export default UniqueCode;
