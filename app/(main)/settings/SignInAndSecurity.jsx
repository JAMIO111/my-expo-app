import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';

const SignInAndSecurity = () => {
  const { player, loading } = useUser();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sign-In & Security',
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem title="First Name" text={'Personal Details'} />
          <SettingsItem title="Surname" text={'Dryden'} />
        </MenuContainer>
      </ScrollView>
    </>
  );
};

export default SignInAndSecurity;

const styles = StyleSheet.create({});
