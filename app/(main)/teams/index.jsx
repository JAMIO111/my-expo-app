import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import LoadingSplash from '@components/LoadingSplash';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import TeamProfile from '@components/TeamProfile';
import { useTeamProfile } from '@hooks/useTeamProfile';

const index = () => {
  const { loading, currentRole } = useUser();
  const { data: teamProfile, isLoading } = useTeamProfile(currentRole?.team?.id);

  if (loading || !currentRole) return <LoadingSplash />;

  console.log('Debug Team Profile:', teamProfile);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={false} title={currentRole?.team?.name || 'Team'} />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <View className={loading || !currentRole ? '' : 'mt-16'}></View>
        <TeamProfile profile={teamProfile} isLoading={isLoading} context="teams" />
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
