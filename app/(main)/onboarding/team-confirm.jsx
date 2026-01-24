import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import TeamLogo from '@components/TeamLogo';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useTeamProfile } from '@hooks/useTeamProfile';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import { ScrollView } from 'react-native-gesture-handler';

const TeamConfirm = () => {
  const { client: supabase } = useSupabaseClient();
  const router = useRouter();
  const params = useLocalSearchParams();
  const team = JSON.parse(params.team || '{}');

  const { data: teamProfile } = useTeamProfile(team?.id);
  const [playerCount, setPlayerCount] = useState(null);
  const [captainName, setCaptainName] = useState('');

  useEffect(() => {
    if (!teamProfile?.captain || !team?.id) return;

    const fetchData = async () => {
      const { data: playersData, error: playersError } = await supabase
        .from('TeamPlayers')
        .select('id')
        .eq('team_id', team.id);

      const { data: captainData, error: captainError } = await supabase
        .from('Players')
        .select('first_name, surname')
        .eq('id', teamProfile.captain)
        .single();

      if (playersError || captainError) {
        console.error({ playersError, captainError });
      } else {
        setPlayerCount(playersData.length);
        setCaptainName(`${captainData.first_name} ${captainData.surname}`);
        console.log({
          playerCount: playersData.length,
          captainName: `${captainData.first_name} ${captainData.surname}`,
        });
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3 of 5',
        }}
      />
      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-brand-dark">
        <View className="flex-1 justify-between gap-3 bg-brand">
          <StepPillGroup steps={5} currentStep={3} />
          <ScrollView className="flex-1 gap-3 p-5">
            <Text
              style={{ lineHeight: 50 }}
              className="mb-4 font-delagothic text-5xl font-bold text-text-on-brand">
              Is this your team?
            </Text>
            <View className="flex-row items-center gap-5 rounded-2xl bg-bg-grouped-2 px-5 py-5 ">
              <TeamLogo
                size={60}
                color1={team?.crest?.color1}
                color2={team?.crest?.color2}
                thickness={team?.crest?.thickness}
                type={team?.crest?.type}
              />
              <View>
                <Text className="font-saira-bold text-3xl text-text-1">
                  {teamProfile?.name || 'Unnamed Team'}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="font-saira-medium text-xl text-text-2">
                    {teamProfile?.division?.district?.name || 'Unnamed District'} -{' '}
                    {teamProfile?.division?.name || 'Unnamed Division'}
                  </Text>
                </View>
              </View>
            </View>
            <View className="mt-5 items-start justify-start gap-2 rounded-2xl bg-bg-grouped-2 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
              <View className="flex-row items-start gap-4">
                <Ionicons name="location-outline" size={25} color="#6B7280" />
                {teamProfile?.address ? (
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        color: '#6B7280',
                        flexShrink: 1,
                        flexWrap: 'wrap',
                      }}
                      className="font-saira text-xl text-text-2">
                      {[
                        teamProfile.address.line_1,
                        teamProfile.address.line_2,
                        teamProfile.address.city,
                        teamProfile.address.county,
                        teamProfile.address.postcode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                ) : (
                  <Text className="font-saira text-xl text-text-2">Address not available</Text>
                )}
              </View>
              <View className="mb-2 h-2 w-full border-b border-theme-gray-5"></View>
              <View className="flex-row items-center gap-4">
                <Ionicons name="people-outline" size={25} color="#6B7280" />
                <Text className="font-saira text-xl text-text-2">{`${playerCount || 0} Member${playerCount !== 1 ? 's' : ''}`}</Text>
              </View>
              <View className="mb-2 h-2 w-full border-b border-theme-gray-5"></View>
              <View className="flex-row items-center gap-4">
                <Ionicons name="ribbon-outline" size={25} color="#6B7280" />
                <Text className="font-saira text-xl text-text-2">
                  Captain - {captainName || 'Not Assigned'}
                </Text>
              </View>
            </View>
          </ScrollView>
          <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pt-6">
            <CTAButton callbackFn={() => router.back()} type="error" text="No - Go Back" />
            <View>
              <CTAButton type="yellow" text="Yes - Continue" callbackFn={handleContinue} />
              <Text className="px-3 text-lg text-text-2"></Text>
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamConfirm;

const styles = StyleSheet.create({});
