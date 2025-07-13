import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SafeViewWrapper from '@components/SafeViewWrapper';

const SignInAndSecurity = () => {
  const { player, loading } = useUser();
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <View className="h-16 flex-row items-center justify-center bg-brand">
                <Text className="font-michroma text-2xl font-bold text-white">
                  Sign-In & Security
                </Text>
              </View>
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem title="First Name" text={'Personal Details'} />
          <SettingsItem title="Surname" text={'Dryden'} />
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default SignInAndSecurity;

const styles = StyleSheet.create({});
