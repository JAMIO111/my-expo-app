import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import LoadingSplash from '@components/LoadingSplash';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar';
import SafeViewWrapper from '@components/SafeViewWrapper';
import TeamProfile from '@components/TeamProfile';
import { useTeamProfile } from '@hooks/useTeamProfile';

const index = () => {
  const { player, loading } = useUser();
  const { data: teamProfile, isLoading } = useTeamProfile(player?.team?.id);

  if (loading || !player) return <LoadingSplash />;

  console.log('Debug Player:', player);
  console.log('Debug Team Profile:', teamProfile);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={false} title={player?.team?.name || 'Team'} />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <View className={loading || !player ? '' : 'mt-16'}></View>
        <TeamProfile profile={teamProfile} isLoading={isLoading} context="teams" />
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
