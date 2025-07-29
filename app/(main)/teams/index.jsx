import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import LoadingSplash from '@components/LoadingSplash';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import TeamProfile from '@components/TeamProfile';
import { useTeamProfile } from '@hooks/useTeamProfile';

const index = () => {
  const router = useRouter();
  const { loading, currentRole } = useUser();
  const { data: teamProfile, isLoading } = useTeamProfile(currentRole?.team?.id);

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
                title={currentRole?.team?.name || 'Team'}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <View className="mt-16 flex-1">
          <TeamProfile profile={teamProfile} isLoading={isLoading} context="teams" />
        </View>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
