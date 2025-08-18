import { Text, View } from 'react-native';
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

const ClaimProfile = () => {
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
          title: 'Step 3 of 4',
        }}
      />
      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-bg-grouped-2">
        <View className="flex-1 justify-between gap-3 bg-brand">
          <StepPillGroup steps={3} currentStep={3} />
          <ScrollView className="flex-1 gap-3 p-5">
            <Text
              style={{ lineHeight: 60 }}
              className="mb-4 font-delagothic text-6xl font-bold text-text-on-brand">
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
                <Text className="font-saira-bold text-3xl text-text-1">{teamProfile?.name}</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="font-saira-medium text-xl text-text-2">
                    {teamProfile?.division?.district?.name} - {teamProfile?.division?.name}
                  </Text>
                </View>
              </View>
            </View>
            <View className="mt-5 items-start justify-start gap-2 rounded-2xl bg-bg-grouped-2 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
              <View className="flex-row items-start gap-2">
                <Ionicons name="location-outline" size={25} color="#6B7280" />
                <View className="">
                  {teamProfile?.address?.line_1 && (
                    <Text className="font-saira text-xl text-text-2">{`${teamProfile?.address?.line_1},`}</Text>
                  )}
                  {teamProfile?.address?.line_2 && (
                    <Text className="font-saira text-xl text-text-2">{`${teamProfile?.address?.line_2},`}</Text>
                  )}
                  {teamProfile?.address?.city && (
                    <Text className="font-saira text-xl text-text-2">{`${teamProfile?.address?.city}, `}</Text>
                  )}
                  {teamProfile?.address?.county && (
                    <Text className="font-saira text-xl text-text-2">{`${teamProfile?.address?.county},`}</Text>
                  )}
                  {teamProfile?.address?.postcode && (
                    <Text className="font-saira text-xl text-text-2">{`${teamProfile?.address?.postcode}`}</Text>
                  )}
                </View>
              </View>
              <View className="mb-2 h-2 w-full border-b border-theme-gray-5"></View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="people-outline" size={25} color="#6B7280" />
                <Text className="font-saira text-xl text-text-2">{`${playerCount} Member${playerCount !== 1 ? 's' : ''}`}</Text>
              </View>
              <View className="mb-2 h-2 w-full border-b border-theme-gray-5"></View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="ribbon-outline" size={25} color="#6B7280" />
                <Text className="font-saira text-xl text-text-2">Captain - {captainName}</Text>
              </View>
            </View>
          </ScrollView>
          <View className="gap-5 rounded-t-3xl bg-bg-grouped-2 px-5 pb-2 pt-5">
            <CTAButton callbackFn={() => router.back()} type="error" text="No - Go Back" />
            <View>
              <CTAButton type="success" text="Yes - Continue" callbackFn={handleContinue} />
              <Text className="px-3 text-lg text-text-2"></Text>
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default ClaimProfile;
