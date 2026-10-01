import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import TeamLogo from '@components/TeamLogo';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useTeamProfile } from '@hooks/useTeamProfile';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeamConfirm = () => {
  useOnboardingStep(2, 3);
  const router = useRouter();
  const params = useLocalSearchParams();
  const team = JSON.parse(params.team || '{}');

  const { data: teamProfile, isLoading: teamLoading } = useTeamProfile(team?.id);
  const [loading, setLoading] = useState(true);
  const [playerCount, setPlayerCount] = useState(null);
  const [captainName, setCaptainName] = useState('');

  useEffect(() => {
    if (!teamProfile || !team?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: playersData, error: playersError } = await supabase
          .from('TeamPlayers')
          .select('id')
          .eq('team_id', team.id)
          .eq('status', 'active');

        // TeamPlayers.role is the source of truth for the captain.
        const { data: captainRow, error: captainError } = await supabase
          .from('TeamPlayers')
          .select('player:Players(first_name, surname)')
          .eq('team_id', team.id)
          .eq('role', 'captain')
          .eq('status', 'active')
          .maybeSingle();

        if (playersError || captainError) {
          console.error({ playersError, captainError });
          return;
        }

        setPlayerCount(playersData.length);
        setCaptainName(
          captainRow?.player ? `${captainRow.player.first_name} ${captainRow.player.surname}` : ''
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamProfile, team?.id]);

  const handleContinue = () => {
    router.push({
      pathname: '/(main)/onboarding/profile-claim',
      params: { team: JSON.stringify(teamProfile) },
    });
  };

  const isLoading = teamLoading || loading;

  const address = teamProfile?.address
    ? [teamProfile.address.line_1, teamProfile.address.line_2, teamProfile.address.city, teamProfile.address.county, teamProfile.address.postcode]
        .filter(Boolean)
        .join(', ')
    : null;

  const Row = ({ icon, text }) => (
    <View className="flex-row items-center gap-4 py-3">
      <Ionicons name={icon} size={22} color="#FFFFFFAA" />
      <Text className="flex-1 font-saira text-lg text-text-on-brand">{text}</Text>
    </View>
  );

  return (
    <OnboardingScreen
      title="Is this your team?"
      subtitle="Check the details below before you continue."
      onCta={handleContinue}
      ctaText="Yes, that's my team"
      ctaDisabled={isLoading || !teamProfile}
      footerExtra={
        <Pressable onPress={() => router.back()} className="items-center py-1">
          <Text className="font-saira-medium text-base text-text-on-brand-2 underline">
            No, go back
          </Text>
        </Pressable>
      }>
      <Animated.View entering={FadeInDown.duration(380)} className="rounded-3xl border-2 border-white/15 bg-white/10 p-5">
        <View className="flex-row items-center gap-5 border-b border-white/15 pb-5">
          <TeamLogo
            size={64}
            color1={team?.crest?.color1}
            color2={team?.crest?.color2}
            thickness={team?.crest?.thickness}
            type={team?.crest?.type}
          />
          <View className="flex-1">
            <Text className="font-saira-bold text-2xl text-text-on-brand">
              {teamProfile?.name || 'Loading…'}
            </Text>
            <Text className="font-saira text-base text-text-on-brand-2">
              {[teamProfile?.division?.district?.name, teamProfile?.division?.name].filter(Boolean).join(' · ') || ' '}
            </Text>
          </View>
        </View>
        <Row icon="location-outline" text={address || 'Address not available'} />
        <Row icon="people-outline" text={`${playerCount || 0} member${playerCount !== 1 ? 's' : ''}`} />
        <Row icon="ribbon-outline" text={`Captain: ${captainName || 'Not assigned'}`} />
      </Animated.View>
    </OnboardingScreen>
  );
};

export default TeamConfirm;
