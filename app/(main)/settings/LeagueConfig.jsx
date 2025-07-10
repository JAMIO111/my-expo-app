import { StyleSheet, Text, View, ScrollView, Settings } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import CTAButton from '@components/CTAButton';
import { generateFixtures } from '@lib/helperFunctions';

const LeagueConfig = () => {
  const [fixtures, setFixtures] = useState([]);
  return (
    <>
      <Stack.Screen
        options={{
          title: 'League Configuration',
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="flex-1 bg-bg-grouped-1 p-5">
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
    </>
  );
};

export default LeagueConfig;

const styles = StyleSheet.create({});
