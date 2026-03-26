import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import EntityStats from '@components/EntityStats';
import { useTeamProfile } from '@/hooks/useTeamProfile';
import TeamLogo from '@components/TeamLogo';

const TeamStatsPage = ({ teamId }) => {
  const { data: teamProfile, isLoading } = useTeamProfile(teamId);
  console.log('Team Profile in TeamStatsPage:', teamProfile);
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={`Team Stats`} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 w-full flex-1 bg-bg-grouped-1">
        <View className="flex w-full flex-row gap-5 border-b border-theme-gray-5 bg-brand p-3">
          <TeamLogo
            type={teamProfile?.crest?.type}
            color1={teamProfile?.crest?.color1}
            color2={teamProfile?.crest?.color2}
            thickness={teamProfile?.crest?.thickness}
            size={60}
            borderRadius={5}
          />

          <View className="items-start justify-center">
            <Text
              style={{ fontSize: 26, lineHeight: 30 }}
              className="font-saira-medium text-text-on-brand">
              {teamProfile?.display_name}
            </Text>
            <Text
              style={{ fontSize: 22 }}
              className="font-saira-medium text-text-on-brand-2 opacity-60">
              {teamProfile?.abbreviation || ''}
            </Text>
          </View>
        </View>
        <ScrollView className="w-full flex-1 gap-5 bg-bg-grouped-1">
          <EntityStats entityId={teamId} entityType="team" />
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

export default TeamStatsPage;

const styles = StyleSheet.create({});
