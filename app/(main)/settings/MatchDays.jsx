import { useState } from 'react';
import { SectionList, Text, View, Alert } from 'react-native';
import { Stack } from 'expo-router';
import SelectionSettingsItem from '@components/SelectionSettingsItem';
import { useFixtureConfig } from '@contexts/AdminContext';

const ordinalWeekdays = ['1st', '2nd', '3rd', '4th'];
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const groupedOptionsByWeekday = weekdays.map((day) => ({
  title: day,
  data: ordinalWeekdays.map((ordinal) => ({
    label: `${ordinal} ${day}`,
    value: `${ordinal.toLowerCase()}_${day.toLowerCase()}`,
  })),
}));

const weeklyOptions = weekdays.map((day) => ({
  label: day,
  value: day.toLowerCase(),
}));

const parseOrdinal = {
  '1st': 1,
  '2nd': 2,
  '3rd': 3,
  '4th': 4,
};

export default function MatchDays() {
  const { fixtureConfig, setFixtureConfig } = useFixtureConfig();

  const isMonthly = fixtureConfig.frequency?.startsWith('monthly');

  const selectedDays = isMonthly
    ? fixtureConfig.monthlyMatchDays?.map(
        ({ week, day }) => `${Object.keys(parseOrdinal)[week - 1]}_${day}`
      ) || []
    : fixtureConfig.matchDays || [];

  const getMaxSelectableDays = () => {
    switch (fixtureConfig.frequency) {
      case 'weekly_once':
      case 'monthly_once':
        return 1;
      case 'weekly_twice':
      case 'monthly_twice':
        return 2;
      default:
        return 0;
    }
  };

  const toggleDay = (dayValue) => {
    const isSelected = selectedDays.includes(dayValue);
    const maxSelectable = getMaxSelectableDays();

    const updated = isSelected
      ? selectedDays.filter((d) => d !== dayValue)
      : [...selectedDays, dayValue];

    if (!isSelected && updated.length > maxSelectable) {
      Alert.alert(
        'Limit Reached',
        `You can only select up to ${maxSelectable} day${maxSelectable > 1 ? 's' : ''}.`
      );
      return;
    }

    if (isMonthly) {
      const parsed = updated.map((value) => {
        const [ordinal, day] = value.split('_');
        return {
          week: parseOrdinal[ordinal],
          day: day.toLowerCase(),
        };
      });
      setFixtureConfig((prev) => ({ ...prev, monthlyMatchDays: parsed }));
    } else {
      setFixtureConfig((prev) => ({ ...prev, matchDays: updated }));
    }
  };

  return (
    <View className="flex-1 bg-bg-grouped-1">
      <Stack.Screen options={{ title: 'Match Days' }} />

      {getMaxSelectableDays() === 0 ? (
        <View className="p-5" style={{ flex: 1, justifyContent: 'start', alignItems: 'center' }}>
          <Text className="w-full rounded-2xl bg-bg-grouped-2 p-5 text-center text-lg font-medium text-text-1">
            No match days available for selection. Select a frequency first.
          </Text>
        </View>
      ) : isMonthly ? (
        <SectionList
          className="bg-bg-grouped-2"
          sections={groupedOptionsByWeekday}
          keyExtractor={(item) => item.value}
          renderSectionHeader={({ section }) => (
            <Text className="bg-bg-grouped-1 py-3 pl-4 text-lg font-bold text-text-1">
              {section.title}
            </Text>
          )}
          renderItem={({ item, index, section }) => (
            <SelectionSettingsItem
              title={item.label}
              internalValue={item.value}
              value={selectedDays}
              setValue={() => toggleDay(item.value)}
              lastItem={index === section.data.length - 1}
            />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <View className="bg-bg-grouped-1 p-5">
          <View className="overflow-hidden rounded-2xl bg-bg-grouped-2">
            {weeklyOptions.map((option, index) => (
              <SelectionSettingsItem
                key={option.value}
                title={option.label}
                internalValue={option.value}
                value={selectedDays}
                setValue={() => toggleDay(option.value)}
                lastItem={index === weeklyOptions.length - 1}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
