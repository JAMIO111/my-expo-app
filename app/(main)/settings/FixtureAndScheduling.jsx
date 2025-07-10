import { StyleSheet, Text, View, ScrollView, Settings } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import CTAButton from '@components/CTAButton';
import { generateFixtures } from '@lib/helperFunctions';

const FixtureAndScheduling = () => {
  const [fixtures, setFixtures] = useState([]);
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Fixtures & Scheduling',
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem
            iconBGColor="red"
            title="Season Start Date"
            icon="calendar-number-outline"
          />
          <SettingsItem
            routerPath="/settings/MatchFrequency"
            iconBGColor="red"
            title="Match Frequency"
            icon="pulse-outline"
          />
          <SettingsItem
            routerPath="/settings/MatchDays"
            iconBGColor="red"
            title="Match Days"
            icon="today-outline"
          />
          <SettingsItem iconBGColor="red" title="Match Times" icon="time-outline" />
          <SettingsItem iconBGColor="green" title="Auto-Generate Fixtures" icon="sync-outline" />
          <SettingsItem
            lastItem={true}
            iconBGColor="blue"
            title="Reschedule Fixtures"
            icon="swap-horizontal-outline"
          />
        </MenuContainer>
        <View className="w-full">
          <CTAButton
            text="Generate Fixtures"
            callbackFn={() =>
              setFixtures(
                generateFixtures({
                  teams: ['Arsenal', 'Chelsea', 'Sunderland', 'Liverpool', 'Newcastle', 'Man City'],
                  startDate: '2025-07-01',
                  matchDays: ['Wednesday', 'Saturday'],
                  reverseGapWeeks: 3, // Minimum gap between original and reverse fixtures
                  time: '20:00',
                })
              )
            }
            type="info"
          />
        </View>
      </ScrollView>
    </>
  );
};

export default FixtureAndScheduling;

const styles = StyleSheet.create({});
