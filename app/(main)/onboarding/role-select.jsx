import { StyleSheet, Text, View } from 'react-native';
import { useUser } from '@contexts/UserProvider';
import { Stack, useRouter } from 'expo-router';
import BrandHeader from '@components/BrandHeader';
import RoleCard from '@components/RoleCard';
import StepPillGroup from '../../components/StepPillGroup';

const RoleSelect = () => {
  const router = useRouter();
  const { roles, currentRole, setCurrentRole } = useUser();
  console.log('Available roles:', roles);

  // Use current role to show context-specific UI
  if (currentRole?.type === 'player') {
    console.log('Team:', currentRole.team);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <BrandHeader />
      <View className={`flex-1 items-stretch justify-start bg-brand p-5 pt-24`}>
        <Text
          style={{ lineHeight: 40 }}
          className="mb-1 px-2 font-saira-bold text-4xl text-text-on-brand">
          Select Your Role.
        </Text>
        <Text className="mb-10 px-2  font-saira text-xl text-text-on-brand-2">
          Which role would you like to onboard as?
        </Text>
        <RoleCard
          title="Admin"
          description="Create a new league"
          onPress={() => {
            setCurrentRole({ type: 'admin' });
            router.push({
              pathname: '/(main)/onboarding/unique-code',
              params: { isNewLeague: true },
            });
          }}
          icon="trophy"
        />
        <RoleCard
          title="Captain"
          description="Create a new team"
          onPress={() => {
            setCurrentRole({ type: 'captain' });
            router.push({
              pathname: '/(main)/onboarding/unique-code',
              params: { isNewTeam: true },
            });
          }}
          icon="people"
        />
        <RoleCard
          title="Player"
          description="Join an existing team"
          onPress={() => {
            setCurrentRole({ type: 'player' });
            router.push({
              pathname: '/(main)/onboarding/unique-code',
              params: { isNewTeam: false },
            });
          }}
          icon="person"
        />
      </View>
    </>
  );
};

export default RoleSelect;

const styles = StyleSheet.create({});
