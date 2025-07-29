import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useUser } from '@contexts/UserProvider';

const index = () => {
  const { currentRole } = useUser();

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Settings" />
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
            routerPath="/settings/TeamManagement"
            iconBGColor="green"
            title="Team Management"
            icon="people-outline"
          />
          <SettingsItem
            lastItem={true}
            iconBGColor="red"
            title="Notifications"
            icon="notifications-outline"
          />
        </MenuContainer>
        {currentRole?.type === 'admin' && (
          <MenuContainer>
            <SettingsItem
              title="League Configuration"
              icon="settings-outline"
              routerPath="/settings/LeagueConfig"
            />
            <SettingsItem
              lastItem={true}
              iconBGColor="red"
              title="Rules & Penalties"
              icon="newspaper-outline"
            />
          </MenuContainer>
        )}

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
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
