import { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CTAButton from '@components/CTAButton';
import SafeViewWrapper from '@components/SafeViewWrapper';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { useFixtureConfig } from '@contexts/AdminContext';

export default function ExcludedDates() {
  const { fixtureConfig, setFixtureConfig } = useFixtureConfig();

  // Initialize excludedDates from context
  const [excludedDates, setExcludedDates] = useState(fixtureConfig?.excludedRanges || []);

  // Sync local state with context when excludedDates changes
  useEffect(() => {
    setFixtureConfig((prev) => ({
      ...prev,
      excludedRanges: excludedDates,
    }));
  }, [excludedDates]);

  const renderDateRange = ({ item, index }) => (
    <View className="mb-3">
      <View className="mb-1 flex-row items-start justify-between rounded-xl bg-bg-grouped-2 p-4">
        <View className="flex-1 flex-row items-center justify-start gap-2">
          <View>
            <Text className="mb-1 pl-3 text-sm font-medium text-text-2">Start Date</Text>
            <DateTimePicker
              mode="date"
              display="default"
              minimumDate={new Date()}
              value={item.startDate || new Date()}
              onChange={(_, selectedDate) => {
                if (!selectedDate) return;
                const updated = [...excludedDates];
                updated[index].startDate = selectedDate;
                setExcludedDates(updated);
              }}
              style={{ width: '100%' }}
            />
          </View>

          <Text className="ml-3 mt-6 text-center text-2xl font-light text-text-1">-</Text>

          <View>
            <Text className="mb-1 pl-3 text-sm font-medium text-text-2">End Date</Text>
            <DateTimePicker
              mode="date"
              display="default"
              minimumDate={item.startDate || new Date()}
              value={item.endDate || new Date()}
              onChange={(_, selectedDate) => {
                if (!selectedDate) return;
                const updated = [...excludedDates];
                updated[index].endDate = selectedDate;
                setExcludedDates(updated);
              }}
              style={{ width: '100%' }}
            />
          </View>
        </View>
        <Pressable
          onPress={() => setExcludedDates(excludedDates.filter((_, i) => i !== index))}
          className="mt-6 h-11 w-11">
          <Ionicon name="close-outline" size={30} color="red" />
        </Pressable>
      </View>
      <View className="flex-1 items-end justify-center">
        <Text className="pr-3 text-lg font-medium text-text-1">
          {item.startDate && item.endDate
            ? Math.ceil(
                (new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)
              ) + ' day break'
            : 'Select dates'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-bg-grouped-1">
      <View className="flex-1 bg-bg-grouped-1">
        {!fixtureConfig.excludedRanges.length ? (
          <View className="p-5" style={{ flex: 1, justifyContent: 'start', alignItems: 'center' }}>
            <Text className="w-full rounded-2xl bg-bg-grouped-2 p-5 text-center text-lg font-medium text-text-1">
              No excluded dates added yet.
            </Text>
          </View>
        ) : (
          <FlatList
            className="p-5"
            data={excludedDates}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderDateRange}
            ListEmptyComponent={
              <Text className="mt-8 text-center text-lg text-text-2">No excluded dates added.</Text>
            }
          />
        )}

        <View className="p-5">
          <CTAButton
            type="info"
            callbackFn={() =>
              setExcludedDates([...excludedDates, { startDate: null, endDate: null }])
            }
            text="Add Excluded Date Range"
          />
        </View>
      </View>
    </SafeViewWrapper>
  );
}
