import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import MenuContainer from '@components/MenuContainer';
import SelectionSettingsItem from '@components/SelectionSettingsItem';
import { useFixtureConfig } from '@contexts/AdminContext';
import { matchFrequencyOptions } from '@lib/fixtureOptions'; // Adjust the import path as necessary

const MatchFrequency = () => {
  const { fixtureConfig, setFixtureConfig } = useFixtureConfig();
  const handleChange = (newValue) => {
    setFixtureConfig((prev) => ({
      ...prev,
      frequency: newValue,
      matchDays: [],
      matchTimes: {},
    }));
  };
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Match Frequency',
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          {matchFrequencyOptions.map((option, index) => (
            <SelectionSettingsItem
              key={option.value}
              title={option.label}
              internalValue={option.value}
              value={fixtureConfig.frequency}
              setValue={handleChange}
              lastItem={index === matchFrequencyOptions.length - 1}
            />
          ))}
        </MenuContainer>
      </ScrollView>
    </>
  );
};

export default MatchFrequency;
