import { StyleSheet, Text, View, ScrollView, Settings } from 'react-native';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import NavBar from '@components/NavBar';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CTAButton from '@components/CTAButton';
import { initiateNewSeason } from '@/lib/helperFunctions'; // Adjust the import path as necessary

const index = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <View className="h-16 flex-row items-center justify-center bg-brand">
                <Text className="font-michroma text-2xl font-bold text-white">Settings</Text>
              </View>
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem
            routerPath="/settings/Account"
            iconBGColor="green"
            title="Account"
            icon="person-outline"
          />
          <SettingsItem
            lastItem={true}
            iconBGColor="red"
            title="Notifications"
            icon="notifications-outline"
          />
        </MenuContainer>

        <MenuContainer>
          <SettingsItem
            title="League Configuration"
            icon="settings-outline"
            routerPath="/settings/LeagueConfig"
          />
          <SettingsItem iconBGColor="green" title="Team Management" icon="people-outline" />
          <SettingsItem
            lastItem={true}
            iconBGColor="red"
            title="Rules & Penalties"
            icon="newspaper-outline"
          />
        </MenuContainer>
        <MenuContainer>
          <SettingsItem title="Privacy" icon="lock-closed-outline" />
          <SettingsItem title="Language" icon="language-outline" />
          <SettingsItem title="Help" icon="help-circle-outline" />
          <SettingsItem
            lastItem={true}
            iconBGColor="blue"
            title="About"
            icon="information-circle-outline"
          />
        </MenuContainer>
      </ScrollView>
      <NavBar />
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
