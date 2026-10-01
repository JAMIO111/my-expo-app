import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CTAButton from '@components/CTAButton';
import { romanNumerals } from '@lib/badgeIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useUser } from '@contexts/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeamDivisionRequest = () => {
  useOnboardingStep(6, 6);
  const { player } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const teamDetails = JSON.parse(params.teamDetails || '{}');
    const [selectedDivision, setSelectedDivision] = useState(null);
  const { uploadToSupabase, uploading } = useCompressAndUploadImage();
  const [loading, setLoading] = useState(false);

  console.log('league in TeamDivisionRequest:', league);
  console.log('teamDetails in TeamDivisionRequest:', teamDetails);

  const ERROR_MESSAGES = {
    TEAM_NAME_TAKEN: 'Another team already uses that team name. Go back and choose a different one.',
    TEAM_DISPLAY_NAME_TAKEN:
      'Another team already uses that display name. Go back and choose a different one.',
    TEAM_ABBREVIATION_TAKEN:
      'Another team already uses that abbreviation. Go back and choose a different one.',
    DIVISION_FULL: 'That division is full. Please choose another.',
    DIVISION_REQUIRED: 'Please choose a division to join.',
    DIVISION_NOT_FOUND: 'That division is no longer available. Please choose another.',
    LEAGUE_NOT_FOUND: 'This league is not available right now.',
    ALREADY_PENDING: 'You already have a team waiting for approval.',
    ALREADY_IN_DISTRICT: 'You are already on a team in this league.',
    INVALID_TEAM_DETAILS: 'Please check your team details and try again.',
    INVALID_ADDRESS: 'Please check your venue details and try again.',
  };

  const handleContinue = async () => {
    if (loading || uploading) return;
    if (!selectedDivision) {
      Toast.show({
        type: 'info',
        text1: 'Choose a Division',
        text2: 'Pick the division your team wants to join.',
      });
      return;
    }
    setLoading(true);

    try {
      let imageURL = null;
      if (teamDetails.photoUri) {
        imageURL = await uploadToSupabase(
          teamDetails.photoUri,
          `${player.id}/`,
          'team-cover-images'
        );
      }

      const address = teamDetails.address || {};
      const { data: newTeamDetails, error } = await supabase.rpc('create_team_with_address', {
        payload: {
          _venue_name: address.venue_name || null,
          _line1: address.line_1,
          _line2: address.line_2 || null,
          _city: address.city,
          _county: address.county || null,
          _post_code: address.postcode,
          _tables: address.tables,
          _name: teamDetails.name,
          _display_name: teamDetails.display_name,
          _abbreviation: teamDetails.abbreviation,
          _crest: teamDetails.crest,
          _division: selectedDivision,
          _district: league.id,
          _is_private: teamDetails.is_private,
          _cover_image_url: imageURL ?? null,
        },
      });

      if (error) throw error;
      if (!newTeamDetails) {
        throw new Error('No team returned from create_team_with_address');
      }

      Toast.show({
        type: 'success',
        text1: 'Team created',
        text2: 'Your request to join the league has been sent. Please wait for approval.',
      });

      // The server has moved the player on to the waiting screen.
      await queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
      router.replace('/(main)/onboarding/(entity-onboarding)/pending-request');
    } catch (err) {
      console.error('Team creation failed:', err);

      Toast.show({
        type: 'error',
        text1: 'Team creation failed',
        text2:
          ERROR_MESSAGES[err?.message] ||
          'An error occurred while creating your team. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingSpaces = (division) => {
    if (!division?.max_competitors) return null;
    return Math.max(division.max_competitors - (division.member_count || 0), 0);
  };

  const selectedDivisionRow = league.Divisions?.find((d) => d.id === selectedDivision);

  const groupedDivisions = league.Divisions?.reduce((acc, division) => {
    const groupId = division.group_id || 'ungrouped';

    if (!acc[groupId]) {
      acc[groupId] = {
        groupName: division.group_name || 'Other',
        divisions: [],
      };
    }

    acc[groupId].divisions.push(division);

    return acc;
  }, {});

  return (
    <OnboardingScreen
      title="Choose a division"
      subtitle="The league admin reviews your request before your team joins the division."
      onCta={handleContinue}
      ctaText={
        loading || uploading
          ? 'Creating team…'
          : selectedDivisionRow
            ? `Request to join ${selectedDivisionRow.name}`
            : 'Choose a division'
      }
      ctaDisabled={loading || uploading || !selectedDivision}
      ctaLoading={loading || uploading}>
      {!league.Divisions?.length ? (
        <View className="rounded-3xl border-2 border-white/15 bg-white/10 p-5">
          <Text className="font-saira-medium text-lg text-text-on-brand">
            This league doesn't have any divisions for teams yet, so it can't take new teams right
            now. Please check back with your league official.
          </Text>
        </View>
      ) : (
        <View className="gap-7">
          {Object.entries(groupedDivisions || {}).map(([groupId, group]) => (
            <View key={groupId} className="gap-3">
              <Text className="pl-1 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
                {group.groupName}
              </Text>
              {group.divisions
                .sort((a, b) => a.tier - b.tier)
                .map((division, i) => {
                  const spaces = getRemainingSpaces(division);
                  const full = spaces === 0;
                  return (
                    <ChoiceCard
                      key={division.id}
                      delay={i * 60}
                      icon="trophy"
                      iconColor={full ? '#6B7280' : '#8B5CF6'}
                      title={division.name}
                      subtitle={
                        division.max_competitors
                          ? full
                            ? 'Full'
                            : `${spaces} space${spaces === 1 ? '' : 's'} left`
                          : 'No team limit'
                      }
                      disabled={full}
                      selected={selectedDivision === division.id}
                      onPress={() =>
                        setSelectedDivision(selectedDivision === division.id ? null : division.id)
                      }
                    />
                  );
                })}
            </View>
          ))}
        </View>
      )}
    </OnboardingScreen>
  );
};

export default TeamDivisionRequest;
