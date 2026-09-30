import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
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

const TeamDivisionRequest = () => {
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
    <>
      <Stack.Screen
        options={{
          title: 'Step 6 of 6',
        }}
      />
      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-brand-dark">
        <View className={`flex-1 justify-between gap-3 bg-brand`}>
          <StepPillGroup steps={6} currentStep={6} />
          <View className="flex-1">
            <Text
              style={{ lineHeight: 40 }}
              className={`p-4 font-delagothic text-3xl font-bold text-text-on-brand`}>
              Choose a division for your team.
            </Text>
            <Text className="px-4 font-saira-medium text-sm text-text-on-brand-2">
              A request to join a division will be sent to the league admin for approval. Once
              approved, your team will be added to the division and you can start adding players and
              competing in the league!
            </Text>
            <View className="flex-1 gap-3">
              {!league.Divisions?.length ? (
                <View className="mx-3 mt-6 rounded-2xl bg-bg-2 p-2">
                  <Text className="text-md p-3 px-5 font-saira-medium text-text-2">
                    This league doesn't have any divisions for teams yet, so it can't take new teams
                    right now. Please check back with your league official.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  className="flex-1 p-3"
                  contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
                  {Object.entries(groupedDivisions || {}).map(([groupId, group]) => (
                    <View key={groupId} className="gap-3">
                      {/* Group Title */}
                      <Text className="px-1 font-saira-semibold text-lg text-text-2">
                        {group.groupName}
                      </Text>

                      {/* Divisions in this group */}
                      {group.divisions
                        .sort((a, b) => a.tier - b.tier)
                        .map((division) => (
                          <Pressable
                            key={division.id}
                            disabled={getRemainingSpaces(division) === 0}
                            onPress={() =>
                              selectedDivision === division.id
                                ? setSelectedDivision(null)
                                : setSelectedDivision(division.id)
                            }
                            style={{
                              borderColor:
                                selectedDivision === division.id ? 'blue' : 'transparent',
                              borderWidth: 2,
                            }}
                            className="w-full flex-row items-center justify-between rounded-xl border border-theme-gray-5 bg-bg-grouped-2 p-2 px-3">
                            <View className="flex-row items-center gap-4">
                              {romanNumerals[division.tier] && (
                                <Image
                                  source={romanNumerals[division.tier]}
                                  style={{ width: 40, height: 48 }}
                                  resizeMode="contain"
                                />
                              )}
                              <View>
                                <Text className="font-saira-semibold text-xl text-text-1">
                                  {division?.name}
                                </Text>
                                <Text
                                  className={`text-md font-saira ${
                                    getRemainingSpaces(division) === 0
                                      ? 'text-theme-red'
                                      : 'text-text-2'
                                  }`}>
                                  {!division?.max_competitors
                                    ? 'No team limit'
                                    : `${getRemainingSpaces(division)} spaces remaining`}
                                </Text>
                              </View>
                            </View>

                            <View
                              className={`h-8 w-8 rounded-full ${
                                selectedDivision === division.id
                                  ? 'border-theme-blue bg-theme-blue'
                                  : 'border-theme-gray-3'
                              } border-2`}>
                              {selectedDivision === division.id && (
                                <Ionicons
                                  name="checkmark"
                                  size={20}
                                  color="white"
                                  style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: [{ translateX: -10 }, { translateY: -10 }],
                                  }}
                                />
                              )}
                            </View>
                          </Pressable>
                        ))}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 py-6">
              <CTAButton
                disabled={loading || uploading || !selectedDivision}
                type="yellow"
                text={
                  loading || uploading
                    ? 'Creating team...'
                    : selectedDivisionRow
                      ? `Request to join ${selectedDivisionRow.name}`
                      : 'Choose a division'
                }
                callbackFn={handleContinue}
              />
              <Text className="font-saira-medium text-sm text-text-on-brand-2">
                The league admin will review your request before your team joins the division.
              </Text>
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamDivisionRequest;

const styles = StyleSheet.create({});
