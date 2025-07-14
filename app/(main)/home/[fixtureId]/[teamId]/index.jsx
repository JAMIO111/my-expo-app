import { View } from 'react-native';
import TeamProfile from '@components/TeamProfile';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTeamProfile } from '@hooks/useTeamProfile';

const index = () => {
  const { teamId } = useLocalSearchParams();
  const { data: profile, isLoading } = useTeamProfile(teamId);

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={profile?.display_name} rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1">
        <TeamProfile profile={profile} isLoading={isLoading} context="home/upcoming-fixture" />
      </View>
    </SafeViewWrapper>
  );
};

export default index;
