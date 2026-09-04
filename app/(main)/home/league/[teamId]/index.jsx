import { StyleSheet, Text, View } from 'react-native';
import { ClipboardCheck } from 'lucide-react-native';
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
              <CustomHeader
                title={profile.display_name || 'Team Profile'}
                rightIcon={ClipboardCheck}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1">
        <TeamProfile profile={profile} isLoading={isLoading} context="home/league/team" />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
