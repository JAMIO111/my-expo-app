import { Text, View, ScrollView } from 'react-native';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import TeamInviteCard from '@components/TeamInviteCard';
import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import MyTeamCard from '@components/MyTeamCard';
import { useUser } from '@contexts/UserProvider';

const Home = () => {
  const { user, player, roles, currentRole } = useUser();
  console.log('User:', user);
  console.log('Player:', player);
  console.log('Roles:', roles);
  console.log('Current Role:', currentRole);

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useTopInset={false} useBottomInset={false}>
              <CustomHeader title="Explore Teams" showBack={false} rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-brand p-5"
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <TeamInviteCard />
        <View className="mt-6 w-full items-start justify-start">
          <Text className="w-full pb-1 pl-2 text-left font-saira-medium text-3xl text-text-on-brand">
            My Teams
          </Text>
          <View className="w-full gap-5">
            {roles
              .filter((role) => role.type !== 'admin')
              .map((role) => (
                <MyTeamCard key={role.id} role={role} />
              ))}
          </View>
        </View>
      </ScrollView>
      <NavBar type="onboarding" />
    </SafeViewWrapper>
  );
};

export default Home;
