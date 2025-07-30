import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary
import { useUser } from '@contexts/UserProvider';

const LeagueConfig = () => {
  const { currentRole } = useUser();

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="League Configuration" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem
            routerPath="settings/LeagueConfig/LeagueName"
            iconBGColor="gray"
            title="District Name"
            icon="text-outline"
            text={currentRole?.district?.name || 'Not Set'}
          />
          <SettingsItem
            routerPath="settings/LeagueConfig/Divisions"
            iconBGColor="gray"
            title="Divisions"
            icon="podium-outline"
            text={
              currentRole?.divisions?.length === 1
                ? currentRole?.divisions[0].name
                : `${currentRole?.divisions?.length} Divisions` || 'No Divisions'
            }
          />
          <SettingsItem iconBGColor="gray" title="Auto-Generate Fixtures" icon="sync-outline" />
          <SettingsItem
            iconBGColor="blue"
            title="Fixture & Schedule Settings"
            icon="calendar-outline"
            routerPath="/settings/FixtureAndScheduling"
          />
          {!currentRole?.activeSeason ? (
            <SettingsItem
              routerPath="/settings/StartNewSeason"
              iconBGColor="green"
              title="Start New Season"
              icon="play"
              lastItem={true}
            />
          ) : (
            <SettingsItem
              iconBGColor="red"
              title="End Current Season"
              icon="square"
              lastItem={true}
            />
          )}
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default LeagueConfig;

const styles = StyleSheet.create({});
