import { StyleSheet, Text, View, ScrollView, Settings } from 'react-native';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';

const LeagueConfig = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <View className="h-16 flex-row items-center justify-center bg-brand">
                <Text className="font-michroma text-xl font-bold text-white">
                  League Configuration
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
          <SettingsItem
            routerPath="settings/LeagueConfig/LeagueName"
            iconBGColor="gray"
            title="District Name"
            icon="text-outline"
            text={'Blyth & District'}
          />
          <SettingsItem
            routerPath="settings/LeagueConfig/Divisions"
            iconBGColor="gray"
            title="Divisions"
            icon="podium-outline"
            text={'3 Divisions'}
          />
          <SettingsItem iconBGColor="gray" title="Auto-Generate Fixtures" icon="sync-outline" />
          <SettingsItem
            iconBGColor="blue"
            title="Fixture & Schedule Settings"
            icon="calendar-outline"
            routerPath="/settings/FixtureAndScheduling"
          />
          <SettingsItem
            routerPath="settings/StartNewSeason"
            iconBGColor="green"
            title="Start New Season"
            icon="play"
          />
          <SettingsItem iconBGColor="red" title="End Current Season" icon="square" />
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default LeagueConfig;

const styles = StyleSheet.create({});
