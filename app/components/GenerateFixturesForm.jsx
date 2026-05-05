import { View, Text, Switch, ScrollView } from 'react-native';
import { useState } from 'react';
import CustomTextInput from './CustomTextInput';
import CTAButton from './CTAButton';
import { supabase } from '@lib/supabase';
import Toast from 'react-native-toast-message';
import { PickerRow } from './FixtureManagement';
import Heading from './Heading';

const GenerateFixturesForm = ({
  competitionInstanceId,
  startDate = new Date(),
  matchTime = '20:00',
  frequencyType = 'days',
  interval = 7,
  selectedDays = [4],
}) => {
  const [fixturePreview, setFixturePreview] = useState([]);
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  const [openPicker, setOpenPicker] = useState(null);
  const [startDateState, setStartDateState] = useState(startDate);
  const [excludedRanges, setExcludedRanges] = useState([]);

  const updateRange = (id, field, value) => {
    setExcludedRanges((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRange = () => {
    setExcludedRanges((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), start: new Date(), end: new Date() },
    ]);
  };

  const removeRange = (id) => {
    setExcludedRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const formatDate = (d) =>
    d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formattedRanges = excludedRanges
    .filter((r) => r.start && r.end)
    .map((r) => ({
      start_date: r.start,
      end_date: r.end,
    }));

  const togglePicker = (picker) => {
    if (openPicker === picker) {
      setOpenPicker(null);
    } else {
      setOpenPicker(picker);
    }
  };

  const handleDateChange = (event, selected) => {
    const currentDate = selected || startDateState;
    setStartDateState(currentDate);
    setOpenPicker(null);
  };

  const handleGeneratePreview = async () => {
    setGeneratingFixtures(true);

    try {
      const { data, error } = await supabase.rpc('generate_league_fixtures_preview', {
        p_competition_instance_id: competitionInstanceId,
        p_start_date: startDateState,
        p_match_time: matchTime,
        p_frequency_type: frequencyType,
        p_frequency_interval: interval,
        p_days_of_week: selectedDays,
        p_rounds: 2,
        p_excluded_ranges: formattedRanges,
      });

      if (error) {
        console.error('Error generating fixture preview:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message,
        });
        return;
      }

      setFixturePreview(data?.fixtures ?? []);
    } catch (err) {
      console.error('Error generating fixture preview:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred while generating the fixture preview.',
      });
    } finally {
      setGeneratingFixtures(false);
    }
  };

  return (
    <View className="flex-1 gap-4">
      <ScrollView
        contentContainerStyle={{ gap: 8, paddingBottom: 140 }}
        className="flex-1 gap-4 bg-bg-2">
        <View className="gap-4 bg-bg-1 p-5">
          <Heading text="Schedule" />
          <PickerRow
            icon="calendar-outline"
            label="Start Date"
            displayValue={formatDate(startDateState)}
            mode="date"
            value={startDateState}
            onChange={handleDateChange}
            isExpanded={openPicker === 'date'}
            onToggle={() => togglePicker('date')}
          />
          <PickerRow
            icon="time-outline"
            label="Match Time"
            displayValue={matchTime}
            mode="time"
            value={new Date(`1970-01-01T${matchTime}:00`)}
            onChange={handleDateChange}
            isExpanded={openPicker === 'time'}
            onToggle={() => togglePicker('time')}
          />
        </View>
        <View className="gap-4 bg-bg-1 p-5">
          <Heading text="Excluded Dates" />

          <Text className="px-1 text-sm text-text-2">
            If there are specific date ranges where you don't want any fixtures to be scheduled, you
            can add them here. This is useful for avoiding holidays, venue unavailability, or any
            other conflicts.
          </Text>
          <View className="gap-6">
            {excludedRanges.map((range, index) => (
              <View key={range.id} className="gap-3">
                <View className="flex-row items-center justify-between gap-2 px-2">
                  <Text className="font-saira-medium text-text-2">
                    Range {index + 1} -{' '}
                    {Math.round((range.end - range.start) / (1000 * 60 * 60 * 24)) + 1} day
                    {Math.round((range.end - range.start) / (1000 * 60 * 60 * 24)) !== 0 ? 's' : ''}
                  </Text>
                  {/* Remove button */}

                  <Text
                    className="rounded-lg bg-theme-red/20 px-2 py-1 text-right text-theme-red"
                    onPress={() => removeRange(range.id)}>
                    Remove
                  </Text>
                </View>
                {/* Start Date */}
                <PickerRow
                  icon="calendar-outline"
                  label="Start Date"
                  displayValue={range.start ? formatDate(range.start) : 'Select start'}
                  mode="date"
                  value={range.start instanceof Date ? range.start : new Date()}
                  onChange={(date) => updateRange(range.id, 'start', date)}
                  isExpanded={openPicker === `start-${range.id}`}
                  onToggle={() => togglePicker(`start-${range.id}`)}
                />

                {/* End Date */}
                <PickerRow
                  icon="calendar-outline"
                  label="End Date"
                  displayValue={range.end ? formatDate(range.end) : 'Select end'}
                  mode="date"
                  value={range.end instanceof Date ? range.end : new Date()}
                  onChange={(date) => updateRange(range.id, 'end', date)}
                  isExpanded={openPicker === `end-${range.id}`}
                  onToggle={() => togglePicker(`end-${range.id}`)}
                />
              </View>
            ))}
          </View>

          {/* Add button */}
          <CTAButton
            type="yellow"
            text={excludedRanges.length === 0 ? 'Add Date Range' : 'Add Another Range'}
            callbackFn={addRange}
          />
        </View>
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 p-5">
        <View
          style={{ borderRadius: 28 }}
          className="border border-theme-gray-3 bg-bg-1/80 p-5 shadow-md backdrop-blur-lg">
          <CTAButton
            type="yellow"
            text={generatingFixtures ? 'Generating...' : 'Preview Fixtures'}
            disabled={generatingFixtures}
            callbackFn={handleGeneratePreview}
          />
        </View>
      </View>
    </View>
  );
};

export default GenerateFixturesForm;
