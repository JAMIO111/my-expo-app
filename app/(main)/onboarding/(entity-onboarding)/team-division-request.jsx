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
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';

const TeamDivisionRequest = () => {
  const { player } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const teamDetails = JSON.parse(params.teamDetails || '{}');
  const teams = JSON.parse(params.teams || '[]');
  const [selectedDivision, setSelectedDivision] = useState(null);
  const { uploadToSupabase, uploading } = useCompressAndUploadImage();
  const [loading, setLoading] = useState(false);

  console.log('league in TeamDivisionRequest:', league);
  console.log('teamDetails in TeamDivisionRequest:', teamDetails);
  console.log('teams in TeamDivisionRequest:', teams);

  const handleContinue = async () => {
    setLoading(true);
    const folderPath = `${teamDetails.name}/`;

    let imageURL = null;

    try {
      if (teamDetails.photoUri) {
        imageURL = await uploadToSupabase(teamDetails.photoUri, folderPath, 'team-cover-images');
      }

      const { data: newTeamDetails, error } = await supabase.rpc('create_team_with_address', {
        payload: {
          _line1: teamDetails.address.line_1,
          _line2: teamDetails.address.line_2 ?? null,
          _city: teamDetails.address.city,
          _county: teamDetails.address.county ?? null,
          _post_code: teamDetails.address.postcode,
          _name: teamDetails.name,
          _display_name: teamDetails.display_name,
          _abbreviation: teamDetails.abbreviation,
          _crest: teamDetails.crest,

          _division: selectedDivision ?? null,
          _district: league.id,
          _is_private: teamDetails.is_private,
          _captain: player.id,
          _cover_image_url: imageURL ?? null,
        },
      });

      if (error) throw error;
      if (!newTeamDetails) {
        throw new Error('No team returned from create_team_with_address');
      }

      if (error) throw error;
      if (!newTeamDetails) {
        throw new Error('No team returned from create_team_with_address');
      }

      Toast.show({
        type: 'success',
        text1: 'Team created',
        text2: 'Your request to join the league has been sent. Please wait for approval.',
      });

      router.push({
        pathname: '/(main)/onboarding/(entity-onboarding)/team-pending-approval',
        params: {
          league: JSON.stringify(league),
          teamDetails: JSON.stringify(newTeamDetails),
        },
      });
    } catch (err) {
      console.error('Team creation failed:', err);

      Toast.show({
        type: 'error',
        text1: 'Team creation failed',
        text2: 'An error occurred while creating your team. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingSpaces = (division) => {
    if (!division?.max_teams) return null;

    const activeTeamsInDivision = teams.filter(
      (team) => team.division === division.id && team.status === 'active'
    ).length;

    return Math.max(division?.max_teams - activeTeamsInDivision, 0);
  };

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
              className={`p-3 font-delagothic text-4xl font-bold text-text-on-brand`}>
              Request to join a division in your league.
            </Text>
            <Text className="text-md p-3 font-saira-medium text-text-on-brand-2">
              A request to join a division will be sent to the league admin for approval. Once
              approved, your team will be added to the division and you can start adding players and
              competing in the league!
            </Text>
            <View className=" flex-1 gap-3 p-3">
              {!league.Divisions?.length ? (
                <Text className="p-3 px-5 font-saira-medium text-lg text-text-on-brand-2">
                  Your league doesn't have any divisions yet. Once your request is approved, the
                  admin can create divisions for your league.
                </Text>
              ) : (
                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{ paddingBottom: 20, gap: 12 }}>
                  {league.Divisions?.sort((a, b) => a.tier - b.tier).map((division) => (
                    <Pressable
                      onPress={() =>
                        selectedDivision === division.id
                          ? setSelectedDivision(null)
                          : setSelectedDivision(division.id)
                      }
                      style={{
                        borderColor: selectedDivision === division.id ? 'blue' : 'transparent',
                        borderWidth: 2,
                      }}
                      className="w-full flex-row items-center justify-between rounded-xl border border-theme-gray-5 bg-bg-grouped-2 p-2 px-3"
                      key={division.id}>
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
                            className={`text-md font-saira ${getRemainingSpaces(division) === 0 ? 'text-theme-red' : 'text-text-2'}`}>
                            {!division?.max_teams
                              ? 'No team limit'
                              : `${getRemainingSpaces(division)} spaces remaining`}
                          </Text>
                        </View>
                      </View>
                      <View
                        className={`h-8 w-8 rounded-full ${selectedDivision === division.id ? 'border-theme-blue bg-theme-blue' : 'border-theme-gray-3'} border-2`}>
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
                </ScrollView>
              )}
            </View>
            <Text className="text-md p-3 font-saira-medium text-text-on-brand-2">
              If your league doesn't have any divisions yet, don't worry - you can still request to
              join the league and the admin can assign you to a division later.
            </Text>
            <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pt-6">
              <CTAButton
                disabled={loading || uploading}
                type="yellow"
                text={
                  !selectedDivision
                    ? 'Request to join league'
                    : getRemainingSpaces(selectedDivision) === 0
                      ? 'Request to join league'
                      : 'Request to join division'
                }
                callbackFn={handleContinue}
              />
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamDivisionRequest;

const styles = StyleSheet.create({});
