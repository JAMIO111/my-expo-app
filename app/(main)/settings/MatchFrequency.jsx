import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import MenuContainer from '@components/MenuContainer';
import SelectionSettingsItem from '@components/SelectionSettingsItem';

const MatchFrequency = () => {
  const [matchFrequency, setMatchFrequency] = useState('weekly'); // Example state for match frequency
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Match Frequency',
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="flex-1 bg-background p-5">
        <MenuContainer>
          <SelectionSettingsItem
            title="2 per week"
            internalValue="twiceWeekly"
            value={matchFrequency}
            setValue={setMatchFrequency}
          />
          <SelectionSettingsItem
            title="1 per week"
            internalValue="weekly"
            value={matchFrequency}
            setValue={setMatchFrequency}
          />
          <SelectionSettingsItem
            title="2 per month"
            internalValue="twiceMonthly"
            value={matchFrequency}
            setValue={setMatchFrequency}
          />
          <SelectionSettingsItem
            title="1 per month"
            internalValue="monthly"
            value={matchFrequency}
            setValue={setMatchFrequency}
            lastItem={true}
          />
        </MenuContainer>
      </ScrollView>
    </>
  );
};

export default MatchFrequency;

const styles = StyleSheet.create({});
