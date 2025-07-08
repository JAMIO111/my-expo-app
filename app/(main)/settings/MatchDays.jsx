import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import MenuContainer from '@components/MenuContainer';
import SelectionSettingsItem from '@components/SelectionSettingsItem';

const MatchFrequency = () => {
  const [selectedDays, setSelectedDays] = useState([]);
  const DAYS_OF_WEEK = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
  ];
  const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);
  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Match Days',
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="flex-1 bg-background p-5">
        <MenuContainer>
          {DAYS_OF_WEEK.map((day) => (
            <SelectionSettingsItem
              key={day.value}
              title={day.label}
              internalValue={day.value}
              value={selectedDays}
              setValue={() => toggleDay(day.value)}
            />
          ))}
        </MenuContainer>
      </ScrollView>
    </>
  );
};

export default MatchFrequency;

const styles = StyleSheet.create({});
