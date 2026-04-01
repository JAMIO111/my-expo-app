import { StyleSheet, View, Text, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useCompetitionInstanceDetails } from '@hooks/useCompetitionInstanceDetails';
import { trophyIcons } from '@lib/badgeIcons';
import Avatar from '@components/Avatar';
import TeamLogo from '@components/TeamLogo';
import LoadingScreen from '@components/LoadingScreen';
import CTAButton from '@components/CTAButton';
import {
  checkEligibility,
  formatCompetitionType,
  formatAgeRestrictions,
} from '@components/CompetitionInstanceCard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@lib/supabase';

const index = () => {
  const { loading, currentRole, player } = useUser();
  const { instanceId } = useLocalSearchParams();
  const { data: competitionInstance, error, isLoading } = useCompetitionInstanceDetails(instanceId);
  const trophyIconMap = Object.fromEntries(trophyIcons.map((t) => [t.key, t]));
  const winnerTrophy = trophyIconMap[competitionInstance?.winner_reward];
  const runnerUpTrophy = trophyIconMap[competitionInstance?.runner_up_reward];

  const deadline = competitionInstance?.entry_deadline
    ? new Date(competitionInstance.entry_deadline)
    : null;
  if (deadline) deadline.setHours(23, 59, 59, 999);

  const isCaptain = currentRole?.team?.captain === player.id;

  const isTeam = competitionInstance?.competition?.competitor_type === 'team';

  const canJoin =
    competitionInstance?.status === 'upcoming' && deadline >= new Date() && (!isTeam || isCaptain);

  console.log('Competition Instance Details:', competitionInstance);

  const joinCompetition = async () => {
    if (isTeam) {
      await supabase.from('CompetitionParticipants').insert({
        team_id: currentRole.team.id,
        competition_instance_id: instanceId,
        joined_at: new Date().toISOString(),
      });
      return;
    } else {
      await supabase.from('CompetitionParticipants').insert({
        player_id: player.id,
        competition_instance_id: instanceId,
        joined_at: new Date().toISOString(),
      });
    }
  };

  const requestToJoin = () => {};

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title={competitionInstance?.name || 'Competition'} />
            </SafeViewWrapper>
          ),
        }}
      />
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
          <ScrollView
            contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 6 }}
            className="mt-16 flex-1 bg-bg-2">
            <View className="gap-6 bg-bg-1 p-4">
              <Text className="px-1 font-saira-medium text-2xl text-text-1">
                Competition Details
              </Text>
              <View className="flex-row">
                <View className="flex-1 gap-3">
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Competition Format</Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {formatCompetitionType(competitionInstance?.competition?.competition_type)}
                    </Text>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Gender</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="px-1 font-saira text-xl text-text-1">
                        {competitionInstance?.gender.slice(0, 1).toUpperCase() +
                          competitionInstance?.gender.slice(1)}
                      </Text>
                      {competitionInstance?.gender === 'male' && (
                        <Ionicons name="male" size={20} color="#0085E5" />
                      )}
                      {competitionInstance?.gender === 'female' && (
                        <Ionicons name="female" size={20} color="#FF69B4" />
                      )}
                    </View>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">
                      Division Requirement
                    </Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {formatCompetitionType(competitionInstance?.division?.name || 'None')}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 gap-3">
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Competitor Type</Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {competitionInstance?.competition?.competitor_type.slice(0, 1).toUpperCase() +
                        competitionInstance?.competition?.competitor_type.slice(1)}
                    </Text>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Age Restriction</Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {formatAgeRestrictions(
                        competitionInstance?.min_age,
                        competitionInstance?.max_age
                      ) || 'None'}
                    </Text>
                  </View>
                </View>
              </View>
              {canJoin &&
                checkEligibility(player, competitionInstance, currentRole) === 'Eligible' && (
                  <CTAButton
                    callbackFn={
                      competitionInstance.entry_type === 'open'
                        ? joinCompetition
                        : competitionInstance.entry_type === 'request'
                          ? requestToJoin
                          : null
                    }
                    text={
                      competitionInstance.entry_type === 'open'
                        ? 'Join Competition'
                        : competitionInstance.entry_type === 'request'
                          ? 'Request to Join'
                          : 'Join Competition'
                    }
                    type="yellow"
                    icon={
                      <Ionicons name="log-in-outline" className="mb-1" size={26} color="black" />
                    }
                  />
                )}
            </View>
            <View className="bg-bg-1 p-4">
              <Text className="px-1 pb-4 font-saira-medium text-2xl text-text-1">
                Competition Participants
              </Text>
              {competitionInstance?.CompetitionParticipants?.length === 0 ? (
                <Text className="px-1 font-saira text-xl text-text-2">No participants yet</Text>
              ) : (
                competitionInstance?.CompetitionParticipants?.map((entity) => {
                  const participant = entity.team || entity.player;
                  return (
                    <View key={participant.id} className="flex-row items-center gap-3 px-1 py-2">
                      {entity.team ? (
                        <TeamLogo
                          type={participant.crest.type}
                          color1={participant.crest.color1}
                          color2={participant.crest.color2}
                          thickness={participant.crest.thickness}
                          size={30}
                        />
                      ) : (
                        <Avatar player={participant} size={36} />
                      )}
                      <Text className="px-1 font-saira-medium text-xl text-text-1">
                        {participant.display_name ||
                          participant.first_name + ' ' + participant.surname}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
            {!competitionInstance?.winner_reward &&
            !competitionInstance?.runner_up_reward ? null : (
              <View className="bg-bg-1 p-4">
                <Text className="px-1 pb-4 font-saira-medium text-2xl text-text-1">
                  Competition Awards
                </Text>
                <View className="flex-row items-stretch justify-around">
                  {winnerTrophy && (
                    <View className="flex-col items-center justify-end">
                      <Image source={winnerTrophy.icon} className="h-30 w-30 mb-4" />
                      <Text className="ml-2 font-saira-medium text-xl text-text-1">
                        {winnerTrophy.name}
                      </Text>
                      <Text className="ml-2 font-saira-medium text-lg text-text-2">WINNER</Text>
                    </View>
                  )}
                  {runnerUpTrophy && (
                    <View className="flex-col items-center justify-end">
                      <Image source={runnerUpTrophy.icon} className="h-30 w-30 mb-4" />
                      <Text className="ml-2 font-saira-medium text-xl text-text-1">
                        {runnerUpTrophy.name}
                      </Text>
                      <Text className="ml-2 font-saira-medium text-lg text-text-2">RUNNER UP</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeViewWrapper>
      )}
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
