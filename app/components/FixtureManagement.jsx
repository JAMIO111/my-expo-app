import { useState, useEffect, useCallback } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import TeamLogo from './TeamLogo';
import Avatar from './Avatar';
import { ScrollView } from 'react-native-gesture-handler';
import LoadingScreen from './LoadingScreen';
import CTAButton from './CTAButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import Heading from './Heading';
import Ionicons from '@expo/vector-icons/Ionicons';

/* ─────────────────────────────────────────────
   Picker Row
───────────────────────────────────────────── */
const PickerRow = ({ icon, label, displayValue, mode, value, onChange, isExpanded, onToggle }) => (
  <View className="w-full rounded-2xl bg-bg-2 shadow-sm">
    <Pressable
      onPress={onToggle}
      className={`flex-row items-center gap-2 p-4 ${
        isExpanded ? 'border-b border-theme-gray-4' : ''
      }`}>
      <Ionicons name={icon} size={20} color="purple" />
      <Text className="pl-2 font-saira text-xl text-text-1">{label}</Text>

      <Text className="flex-1 text-right font-saira-medium text-xl text-text-1">
        {displayValue}
      </Text>

      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
    </Pressable>

    {isExpanded && (
      <DateTimePicker
        key={mode} // ✅ CRITICAL FIX (prevents crash)
        value={value}
        mode={mode}
        is24Hour
        display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
        minimumDate={mode === 'date' ? new Date(2000, 0, 1) : undefined}
        maximumDate={mode === 'date' ? new Date(2100, 11, 31) : undefined}
        onChange={(event, selected) => {
          // Android behaves like modal → close after interaction
          if (Platform.OS === 'android') {
            onToggle();
          }

          if (selected && event.type !== 'dismissed') {
            onChange(selected);
          }
        }}
      />
    )}
  </View>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const FixtureManagement = ({ fixtureId }) => {
  const { data: fixture, isLoading } = useFixtureDetails(fixtureId);

  const [dateTime, setDateTime] = useState(new Date());
  const [openPicker, setOpenPicker] = useState(null); // 'date' | 'time' | null

  useEffect(() => {
    if (fixture?.date_time) {
      setDateTime(new Date(fixture.date_time));
    }
  }, [fixture?.date_time]);

  const togglePicker = (type) => {
    setOpenPicker((prev) => (prev === type ? null : type));
  };

  /* ───────────── Date / Time Handling ───────────── */

  const handleDateChange = useCallback(
    (selected) => {
      const updated = new Date(selected);
      updated.setHours(dateTime.getHours(), dateTime.getMinutes(), 0, 0);
      setDateTime(updated);
    },
    [dateTime]
  );

  const handleTimeChange = useCallback(
    (selected) => {
      const updated = new Date(dateTime);
      updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setDateTime(updated);
    },
    [dateTime]
  );

  const formatDate = (d) =>
    d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (d) =>
    d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) return <LoadingScreen />;

  const isIndividual = fixture?.competitor_type === 'individual';

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between gap-10 rounded-t-2xl bg-bg-3 p-3 shadow-sm">
        {/* Home */}
        <View>
          <View className="flex-row items-center gap-4">
            {isIndividual ? (
              <Avatar size={40} player={fixture?.homeCompetitor} />
            ) : (
              <TeamLogo size={40} {...fixture?.homeCompetitor?.crest} />
            )}
            <Text className="font-saira-semibold text-3xl text-text-1">
              {isIndividual
                ? fixture?.homeCompetitor?.nickname?.toUpperCase() ||
                  `(${fixture?.homeCompetitor?.first_name})`
                : fixture?.homeCompetitor?.abbreviation}
            </Text>
          </View>
          <Text className="text-text-2">{fixture?.homeCompetitor?.display_name}</Text>
        </View>

        {/* Away */}
        <View className="items-end">
          <View className="flex-row items-center gap-4">
            <Text className="font-saira-semibold text-3xl text-text-1">
              {isIndividual
                ? fixture?.awayCompetitor?.nickname?.toUpperCase() ||
                  `(${fixture?.awayCompetitor?.first_name})`
                : fixture?.awayCompetitor?.abbreviation}
            </Text>

            {isIndividual ? (
              <Avatar size={40} player={fixture?.awayCompetitor} />
            ) : (
              <TeamLogo size={40} {...fixture?.awayCompetitor?.crest} />
            )}
          </View>
          <Text className="text-text-2">{fixture?.awayCompetitor?.display_name}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 bg-bg-2">
        <View className="gap-5 bg-bg-1 p-5">
          <Heading text="Fixture Scheduling" />

          <PickerRow
            icon="calendar-outline"
            label="Fixture Date"
            displayValue={formatDate(dateTime)}
            mode="date"
            value={dateTime}
            onChange={handleDateChange}
            isExpanded={openPicker === 'date'}
            onToggle={() => togglePicker('date')}
          />

          <PickerRow
            icon="time-outline"
            label="Fixture Time"
            displayValue={formatTime(dateTime)}
            mode="time"
            value={dateTime}
            onChange={handleTimeChange}
            isExpanded={openPicker === 'time'}
            onToggle={() => togglePicker('time')}
          />

          {/* Summary */}
          <Heading text="Fixture Details" />

          <View className="gap-3 rounded-2xl bg-bg-2 p-4">
            <Text>
              {dateTime.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>

            <Text>
              {[
                fixture?.address?.name,
                fixture?.address?.line1,
                fixture?.address?.line2,
                fixture?.address?.city,
                fixture?.address?.postcode,
              ]
                .filter(Boolean)
                .join(', ') || 'TBD'}
            </Text>

            <Text>{fixture?.status || 'TBD'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Save */}
      <View className="p-3 pb-16">
        <CTAButton
          text="Save Changes"
          type="yellow"
          callbackFn={() => {
            console.log('Saving:', dateTime);
          }}
        />
      </View>
    </View>
  );
};

export default FixtureManagement;
