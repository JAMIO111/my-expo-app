import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import { useLocalSearchParams } from 'expo-router';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import TeamProfile from '@components/TeamProfile';
import { useTeamProfile } from '@hooks/useTeamProfile';

const TeamProfilePage = () => {
  const router = useRouter();
  const { teamId } = useLocalSearchParams();
  const { data: teamProfile, isLoading } = useTeamProfile(teamId);

  console.log('Debug Team Profile:', teamProfile);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                rightIcon="settings-outline"
                onRightPress={() => router.push(`/settings`)}
                showBack={false}
                title={teamProfile?.display_name || 'Team'}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <View className="mt-16 flex-1">
          <TeamProfile profile={teamProfile} isLoading={isLoading} context="admin" />
        </View>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default TeamProfilePage;

const styles = StyleSheet.create({});
