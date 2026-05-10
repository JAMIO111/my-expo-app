import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import CustomTextInput from './CustomTextInput';
import CTAButton from './CTAButton';
import { supabase } from '@lib/supabase';
import Toast from 'react-native-toast-message';
import { PickerRow } from './FixtureManagement';
import Heading from './Heading';
import CustomDropdown from './CustomDropdown';
import TeamLogo from './TeamLogo';
import Avatar from './Avatar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const OCCURRENCE_OPTIONS = [
  { label: '1st', value: 1 },
  { label: '2nd', value: 2 },
  { label: '3rd', value: 3 },
  { label: '4th', value: 4 },
  { label: 'Last', value: -1 },
];

const FREQUENCY_OPTIONS = [
  { label: 'Weekly', value: 'weeks' },
  { label: 'Monthly', value: 'months' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ordinal = (n) => {
  if (n === -1) return 'Last';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const makeDefaultSlot = (frequencyType) =>
  frequencyType === 'months'
    ? { occurrence: 1, dayOfWeek: 4, time: '20:00' }
    : { dayOfWeek: 4, time: '20:00' };

const resizeSlots = (current, nextCount, frequencyType) => {
  const slots = [...current];
  while (slots.length < nextCount) {
    slots.push(makeDefaultSlot(frequencyType));
  }
  return slots.slice(0, nextCount);
};

const slotLabel = (slot, index, frequencyType) => {
  const day = DAY_OPTIONS.find((d) => d.value === slot.dayOfWeek)?.label ?? '—';
  if (frequencyType === 'months') {
    const occ = ordinal(slot.occurrence);
    return `Slot ${index + 1} · ${occ} ${day} at ${slot.time}`;
  }
  return `Slot ${index + 1} · ${day} at ${slot.time}`;
};

const timeToDate = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// This was fine, but explicit is safer
const dateToTime = (date) => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const formatDate = (d) =>
  d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── SlotEditor ──────────────────────────────────────────────────────────────

const SlotEditor = ({
  slot,
  index,
  frequencyType,
  openPicker,
  onTogglePicker,
  onChange,
  disabled,
}) => {
  const timePickerKey = `slot-time-${index}`;

  const handleTimeChange = (selected) => {
    onChange('time', dateToTime(selected));
  };

  return (
    <View
      className={`gap-3 rounded-2xl border-theme-gray-3 bg-bg-2 p-4 shadow-sm ${disabled ? 'opacity-50' : ''}`}>
      {/* Slot header */}
      <Text className="px-1 font-saira-medium text-text-1">
        {slotLabel(slot, index, frequencyType)}
      </Text>

      {/* Monthly-only: occurrence picker */}
      {frequencyType === 'months' && (
        <CustomDropdown
          leftIconName="layers-outline"
          iconColor="#8B5CF6"
          title="Week of month"
          titleColor="text-text-1"
          placeholder="Select occurrence"
          options={OCCURRENCE_OPTIONS}
          value={slot.occurrence}
          onChange={(value) => onChange('occurrence', value)}
          disabled={disabled}
        />
      )}

      {/* Day of week */}
      <CustomDropdown
        leftIconName="calendar-outline"
        iconColor="#8B5CF6"
        title="Day of week"
        titleColor="text-text-1"
        placeholder="Select day"
        options={DAY_OPTIONS}
        value={slot.dayOfWeek}
        onChange={(value) => onChange('dayOfWeek', value)}
        disabled={disabled}
      />

      {/* Time */}
      <PickerRow
        icon="time-outline"
        label="Match time"
        displayValue={slot.time}
        mode="time"
        value={timeToDate(slot.time)}
        onChange={handleTimeChange}
        isExpanded={openPicker === timePickerKey}
        onToggle={() => onTogglePicker(timePickerKey)}
        backgroundColor="bg-bg-1"
        disabled={disabled}
      />
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const GenerateFixturesForm = ({
  competitionInstanceId,
  startDate = new Date(),
  frequencyType = 'weeks',
  interval = 1,
  closeModal,
}) => {
  const [fixturePreview, setFixturePreview] = useState([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [generatingFixturesPreview, setGeneratingFixturesPreview] = useState(false);
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  const [openPicker, setOpenPicker] = useState(null);
  const [startDateState, setStartDateState] = useState(startDate);
  const [excludedRanges, setExcludedRanges] = useState([]);
  const [frequencyTypeState, setFrequencyTypeState] = useState(frequencyType);
  const [intervalState, setIntervalState] = useState(interval);
  const [intervalInput, setIntervalInput] = useState(interval.toString());
  const [roundsState, setRoundsState] = useState(2); // For simplicity, fixed at 2 rounds for now

  const queryClient = useQueryClient();

  const scrollRef = useRef(null);
  const previewRef = useRef(null);
  const topRef = useRef(null);

  // Each slot holds the schedule config for one matchday per period
  const [slots, setSlots] = useState(() =>
    Array.from({ length: interval }, () => makeDefaultSlot(frequencyType))
  );

  // Keep slots in sync when frequency type or interval changes
  useEffect(() => {
    setSlots((prev) => {
      // Re-shape existing slots to match new frequency type (add/remove occurrence field)
      const reshaped = prev.map((s) =>
        frequencyTypeState === 'months'
          ? { occurrence: s.occurrence ?? 1, dayOfWeek: s.dayOfWeek, time: s.time }
          : { dayOfWeek: s.dayOfWeek, time: s.time }
      );
      return resizeSlots(reshaped, Math.max(1, intervalState || 1), frequencyTypeState);
    });
  }, [frequencyTypeState, intervalState]);

  useEffect(() => {
    const max = frequencyTypeState === 'weeks' ? 7 : 4;
    const clamped = Math.min(intervalState, max);
    if (clamped !== intervalState) {
      setIntervalState(clamped);
      setIntervalInput(clamped.toString());
    }
    setSlots((prev) => resizeSlots(prev, Math.max(1, clamped), frequencyTypeState));
  }, [frequencyTypeState, intervalState]);

  const updateSlot = (index, field, value) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  // ── Excluded ranges ──────────────────────────────────────────────────────

  const updateRange = (id, field, value) => {
    setExcludedRanges((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRange = () => {
    setExcludedRanges((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), start: startDateState, end: startDateState },
    ]);
  };

  const removeRange = (id) => {
    setExcludedRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const formatLocalDate = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formattedRanges = excludedRanges
    .filter((r) => r.start && r.end)
    .map((r) => ({
      start_date: formatLocalDate(r.start),
      end_date: formatLocalDate(r.end),
    }));

  // ── Pickers ──────────────────────────────────────────────────────────────

  const togglePicker = (picker) => setOpenPicker((prev) => (prev === picker ? null : picker));

  const handleStartDateChange = (selected) => {
    setStartDateState(selected);
    setOpenPicker(null);
  };

  // ── Summary label ─────────────────────────────────────────────────────────

  const getSummaryLabel = () => {
    const n = intervalState;
    if (!n || n < 1) return null;
    if (frequencyTypeState === 'weeks') {
      if (n === 1) return 'One match round per week';
      return `${n} match rounds per week`;
    }
    if (frequencyTypeState === 'months') {
      if (n === 1) return 'One match round per month';
      return `${n} match rounds per month`;
    }
    return null;
  };

  const summaryLabel = getSummaryLabel();

  const handleScrollToTop = () => {
    requestAnimationFrame(() => {
      previewRef.current?.measureLayout(
        scrollRef.current,
        (_, y) => {
          scrollRef.current?.scrollTo({ y, animated: true });
        },
        () => {}
      );
    });
  };

  // ── Generate preview ──────────────────────────────────────────────────────

  const handleGeneratePreview = async () => {
    setGeneratingPreview(true);
    setFixturePreview([]);

    try {
      const scheduleSlots = slots.map((s) => ({
        day_of_week: s.dayOfWeek,
        match_time: s.time,
        ...(frequencyTypeState === 'months' ? { occurrence: s.occurrence } : {}),
      }));

      const payload = {
        p_competition_instance_id: competitionInstanceId,
        p_start_date: formatLocalDate(startDateState),
        p_frequency_type: frequencyTypeState,
        p_frequency_interval: intervalState,
        p_schedule_slots: scheduleSlots,
        p_rounds: roundsState,
        p_excluded_ranges: formattedRanges,
      };

      const { data, error } = await supabase.rpc('generate_schedule_dates_preview', payload);
      console.log('RPC response for preview generation:', data, error);
      if (error) {
        console.log('RPC error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No data returned from preview function');
      }

      setFixturePreview(data);
      handleScrollToTop();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to generate preview',
      });

      closeModal(); // now actually reachable
    } finally {
      setGeneratingPreview(false);
    }
  };

  // ── Generate fixtures ─────────────────────────────────────────────────────

  const handleGenerateFixturesPreview = async () => {
    setGeneratingFixturesPreview(true);

    try {
      const payload = {
        p_competition_instance_id: competitionInstanceId,
        p_start_date: formatLocalDate(startDateState),
        p_frequency_type: frequencyTypeState,
        p_frequency_interval: intervalState,
        p_schedule_slots: slots.map((s) => ({
          day_of_week: s.dayOfWeek,
          match_time: s.time,
          ...(frequencyTypeState === 'months' ? { occurrence: s.occurrence } : {}),
        })),
        p_rounds: roundsState,
        p_excluded_ranges: formattedRanges,
      };

      const { data, error } = await supabase.rpc('generate_league_fixtures_from_dates', {
        p_competition_instance_id: competitionInstanceId,
        p_dates: fixturePreview?.dates?.map((d) => ({ datetime: d.datetime })),
        p_rounds: roundsState,
      });

      console.log('RPC response for fixture generation:', data, error);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to generate fixtures');
        return;
      }

      setFixturePreview(data);
      handleScrollToTop();
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while generating the fixtures.');
    } finally {
      setGeneratingFixturesPreview(false);
    }
  };

  const handleSaveFixtures = async () => {
    setGeneratingFixtures(true);
    try {
      const { data, error } = await supabase.rpc('save_league_fixtures', {
        p_competition_instance_id: competitionInstanceId,
        p_fixtures: fixturePreview?.dates ?? [],
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to save fixtures');
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ['fixtures-grouped', competitionInstanceId],
      });
      await queryClient.invalidateQueries(['authUserProfile']);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Fixtures have been generated and saved successfully.',
      });

      closeModal();
    } catch (err) {
      console.error('Unexpected error during fixture generation:', err);
      Alert.alert('Error', 'An unexpected error occurred while saving the fixtures.');
    } finally {
      setGeneratingFixtures(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 gap-4">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          gap: 8,
          paddingBottom: fixturePreview?.dates?.length > 0 ? 200 : 120,
        }}
        className="flex-1 bg-bg-2">
        {/* ── Matchday Schedule section ── */}
        <View ref={topRef} className="gap-4 bg-bg-1 p-5">
          <Heading text="Matchday Schedule" />

          {/* Frequency type + interval row */}
          <View className="flex-row gap-2">
            <View style={{ flex: 3 }}>
              <CustomDropdown
                leftIconName="pulse-outline"
                iconColor="#8B5CF6"
                title="Frequency"
                titleColor="text-text-1"
                placeholder="Select frequency"
                options={FREQUENCY_OPTIONS}
                value={frequencyTypeState}
                onChange={(value) => setFrequencyTypeState(value)}
                disabled={fixturePreview?.dates?.length > 0}
              />
            </View>
            <View style={{ flex: 2 }}>
              <CustomTextInput
                leftIconName="repeat-outline"
                title="Times per period"
                placeholder="e.g. 1, 2"
                titleColor="text-text-1"
                value={intervalInput}
                onChangeText={(text) => {
                  // allow free typing — only strip non-numeric chars
                  setIntervalInput(text.replace(/[^0-9]/g, ''));
                }}
                onBlur={() => {
                  const max = frequencyTypeState === 'weeks' ? 7 : 4;
                  const n = Math.min(Math.max(parseInt(intervalInput, 10) || 1, 1), max);
                  setIntervalInput(n.toString());
                  setIntervalState(n);
                }}
                keyboardType="numeric"
                disabled={fixturePreview?.dates?.length > 0}
              />
            </View>
          </View>

          {/* Summary label */}
          {summaryLabel ? (
            <View className="rounded-xl bg-theme-blue/20 p-3">
              <Text className="text-md px-1 font-saira-medium text-theme-blue">{summaryLabel}</Text>
            </View>
          ) : (
            <View className="rounded-lg bg-theme-red/20 p-3">
              <Text className="text-md font-saira-medium text-theme-red">
                Please select both frequency and interval.
              </Text>
            </View>
          )}

          {/* Start date */}
          <PickerRow
            icon="calendar-outline"
            label="Season start"
            displayValue={formatDate(startDateState)}
            mode="date"
            value={startDateState}
            onChange={handleStartDateChange}
            isExpanded={openPicker === 'start-date'}
            onToggle={() => togglePicker('start-date')}
            disabled={fixturePreview?.dates?.length > 0}
            minimumDate={new Date()}
          />
          <CustomTextInput
            leftIconName="repeat-outline"
            title="Round Robin Cycles"
            placeholder="e.g. 1, 2"
            titleColor="text-text-1"
            value={roundsState.toString()}
            onChangeText={(text) => {
              // allow free typing — only strip non-numeric chars
              setRoundsState(parseInt(text.replace(/[^0-9]/g, ''), 10) || '');
            }}
            onBlur={() => {
              let n = roundsState || 2;
              n = Math.max(n, 1);
              setRoundsState(n);
            }}
            keyboardType="numeric"
            disabled={fixturePreview?.dates?.length > 0}
          />
          <Text className="px-2 font-saira text-sm text-text-2">
            1 cycle = Each team plays every other team once.{'\n'}2 cycles = Home and away fixtures.
          </Text>
        </View>

        {/* ── Per-slot schedule config section ── */}
        <View className="gap-4 bg-bg-1 p-5">
          <Heading
            text={frequencyTypeState === 'weeks' ? 'Matchday Slots' : 'Monthly Matchday Slots'}
          />
          <Text className="px-1 font-saira text-sm text-text-2">
            {frequencyTypeState === 'weeks'
              ? 'Configure the day and kick-off time for each weekly matchday slot.'
              : 'Choose which week of the month, which day, and what time each slot kicks off.'}
          </Text>

          <View className="gap-4">
            {slots.map((slot, index) => (
              <SlotEditor
                key={index}
                slot={slot}
                index={index}
                frequencyType={frequencyTypeState}
                openPicker={openPicker}
                onTogglePicker={togglePicker}
                onChange={(field, value) => updateSlot(index, field, value)}
                disabled={fixturePreview?.dates?.length > 0}
              />
            ))}
          </View>
        </View>

        {/* ── Excluded Dates section ── */}
        <View className="gap-4 bg-bg-1 p-5">
          <Heading text="Excluded Dates" />
          <Text className="px-1 font-saira text-sm text-text-2">
            Add date ranges where no fixtures should be scheduled — useful for holidays, venue
            closures, or other conflicts.
          </Text>

          <View className="gap-6 pb-2">
            {excludedRanges.map((range, index) => {
              const days = Math.round((range.end - range.start) / (1000 * 60 * 60 * 24));
              return (
                <View key={range.id} className="gap-3">
                  <View className="flex-row items-center justify-between gap-2 px-2">
                    <Text className="font-saira-medium text-text-2">
                      Range {index + 1} · {days + 1} day{days !== 0 ? 's' : ''}
                    </Text>
                    <Pressable
                      disabled={fixturePreview?.dates?.length > 0}
                      className={`${fixturePreview?.dates?.length > 0 ? 'opacity-50' : ''} rounded-lg bg-theme-red/20 px-2 py-1 text-right text-theme-red`}
                      onPress={() => removeRange(range.id)}>
                      <Text className="font-saira-medium text-theme-red">Remove</Text>
                    </Pressable>
                  </View>

                  <PickerRow
                    icon="calendar-outline"
                    label="Start Date"
                    displayValue={range.start ? formatDate(range.start) : 'Select start'}
                    mode="date"
                    value={range.start instanceof Date ? range.start : startDateState}
                    minimumDate={startDateState}
                    onChange={(selected) => {
                      updateRange(range.id, 'start', selected);
                      if (range.end && selected > range.end) {
                        updateRange(range.id, 'end', selected);
                      }
                    }}
                    isExpanded={openPicker === `ex-start-${range.id}`}
                    onToggle={() => togglePicker(`ex-start-${range.id}`)}
                    disabled={fixturePreview?.dates?.length > 0}
                  />

                  <PickerRow
                    icon="calendar-outline"
                    label="End Date"
                    minimumDate={range.start || startDateState}
                    displayValue={range.end ? formatDate(range.end) : 'Select end'}
                    mode="date"
                    value={range.end instanceof Date ? range.end : startDateState}
                    onChange={(selected) => {
                      updateRange(range.id, 'end', selected);
                      if (range.start && selected < range.start) {
                        updateRange(range.id, 'start', selected);
                      }
                    }}
                    isExpanded={openPicker === `ex-end-${range.id}`}
                    onToggle={() => togglePicker(`ex-end-${range.id}`)}
                    disabled={fixturePreview?.dates?.length > 0}
                  />
                </View>
              );
            })}
          </View>

          <CTAButton
            icon={<Ionicons className="mb-1" name="add" size={28} color="#FFFFFF" />}
            type="default"
            text={excludedRanges.length === 0 ? 'Add Date Range' : 'Add Another Range'}
            callbackFn={addRange}
            disabled={fixturePreview?.dates?.length > 0}
          />
        </View>
        {fixturePreview?.dates?.length > 0 && (
          <View ref={previewRef} className="gap-4 bg-bg-1 p-5">
            <Heading text="Fixture Preview" />
            <Text className="px-1 font-saira text-sm text-text-2">
              This is a preview of the generated fixture list based on your current settings. Please
              review it carefully before confirming. Note that this is just a preview — no fixtures
              have been created yet.
            </Text>
            <View className="gap-3">
              {fixturePreview?.dates?.map((date, index) => (
                <View key={index} className="gap-2 rounded-2xl bg-bg-2 p-3 shadow-sm">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-col">
                      <Text className="font-saira-medium text-lg text-text-2">
                        Round {index + 1}
                      </Text>
                    </View>
                    <Text className="font-saira text-lg text-text-1">
                      {date.datetime
                        ? new Date(date.datetime).toLocaleDateString('en-GB', {
                            timeZone: 'Europe/London',
                            weekday: 'short',
                            year: '2-digit',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'TBD'}
                    </Text>
                  </View>
                  {date?.fixtures?.length > 0 && (
                    <>
                      <View className="h-px bg-theme-gray-4" />
                      <View className="gap-2">
                        {date?.fixtures.map((fixture, fixtureIndex) => {
                          const homeTeam = fixturePreview.participants.find(
                            (p) => p.id === fixture.home_id
                          );
                          const awayTeam = fixturePreview.participants.find(
                            (p) => p.id === fixture.away_id
                          );
                          return (
                            <View
                              key={fixtureIndex}
                              className="flex-row items-center justify-between">
                              <View className="flex-1 flex-row items-center gap-2">
                                {homeTeam.type === 'team' ? (
                                  <TeamLogo {...homeTeam?.avatar_or_logo} size={20} />
                                ) : (
                                  <Avatar {...homeTeam?.avatar_or_logo} size={20} />
                                )}

                                <Text className="font-saira text-text-1">
                                  {homeTeam?.name || 'TBD'}
                                </Text>
                              </View>
                              <Text className="font-saira text-text-2">vs</Text>
                              <View className="flex-1 flex-row items-center justify-end gap-2">
                                <Text className="font-saira text-text-1">
                                  {awayTeam?.name || 'TBD'}
                                </Text>
                                {awayTeam.type === 'team' ? (
                                  <TeamLogo {...awayTeam?.avatar_or_logo} size={20} />
                                ) : (
                                  <Avatar {...awayTeam?.avatar_or_logo} size={20} />
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View className="absolute bottom-0 left-0 right-0 p-5">
        <View
          style={{ borderRadius: 28 }}
          className="gap-4 border border-theme-gray-3 bg-bg-1/80 p-5 shadow-md backdrop-blur-lg">
          {fixturePreview?.dates?.length > 0 && (
            <>
              <CTAButton
                type="error"
                text="Make Changes"
                icon={<Ionicons className="mb-1" name="pencil" size={24} color="#FFFFFF" />}
                callbackFn={() => {
                  setFixturePreview([]);
                  requestAnimationFrame(() => {
                    topRef.current?.measureLayout(
                      scrollRef.current,
                      (x, y) => {
                        scrollRef.current?.scrollTo({
                          y,
                          animated: true,
                        });
                      },
                      () => {}
                    );
                  });
                }}
              />
              {fixturePreview?.participants?.length > 0 ? (
                <CTAButton
                  type="success"
                  icon={
                    <Ionicons className="mb-1" name="document-text" size={24} color="#FFFFFF" />
                  }
                  text={generatingFixtures ? 'Generating…' : 'Generate Fixtures'}
                  disabled={generatingFixtures}
                  callbackFn={handleSaveFixtures}
                  loading={generatingFixtures}
                />
              ) : (
                <CTAButton
                  type="success"
                  icon={
                    <Ionicons className="mb-1" name="document-text" size={24} color="#FFFFFF" />
                  }
                  text={generatingFixturesPreview ? 'Generating…' : 'Preview Fixtures'}
                  disabled={generatingFixturesPreview}
                  callbackFn={handleGenerateFixturesPreview}
                  loading={generatingFixturesPreview}
                />
              )}
            </>
          )}
          {(!fixturePreview?.dates || fixturePreview?.dates?.length === 0) && (
            <CTAButton
              type="yellow"
              icon={
                <Ionicons className="mb-1" name="document-text-outline" size={24} color="#000000" />
              }
              text={generatingPreview ? 'Generating…' : 'Preview Schedule'}
              disabled={generatingPreview}
              callbackFn={handleGeneratePreview}
              loading={generatingPreview}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default GenerateFixturesForm;
