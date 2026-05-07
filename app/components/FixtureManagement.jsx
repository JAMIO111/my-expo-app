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
import CustomDropdown from './CustomDropdown';
import { useAddresses } from '@hooks/useAddresses';
import { useUser } from '@contexts/UserProvider';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export const PickerRow = ({
  icon,
  label,
  displayValue,
  mode,
  value,
  onChange,
  isExpanded,
  onToggle,
  backgroundColor = 'bg-bg-2',
}) => (
  <View className={`w-full items-center justify-center rounded-xl shadow-sm ${backgroundColor}`}>
    <Pressable
      onPress={onToggle}
      className={`flex-row items-center gap-2 p-4 pr-3 ${isExpanded ? 'border-b border-theme-gray-4' : ''}`}>
      <Ionicons name={icon} size={24} color="#8B5CF6" />

      <View className="flex-1 flex-row items-center justify-between gap-3">
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          className="flex-1 pl-2 font-saira text-xl text-text-1">
          {label}
        </Text>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          className="flex-1 text-right font-saira-medium text-xl text-text-1">
          {displayValue}
        </Text>
      </View>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#9CA3AF"
        style={{ marginLeft: 6 }}
      />
    </Pressable>

    {isExpanded && (
      <DateTimePicker
        value={value}
        mode={mode}
        display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
        is24Hour
        onChange={(event, selected) => {
          if (Platform.OS === 'android') {
            // Always close the picker on Android (dialog auto-dismisses)
            onToggle();
          }
          // Only update state on a real selection
          if (selected && event.type !== 'dismissed') {
            onChange(selected);
          }
        }}
      />
    )}
  </View>
);

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
const FixtureManagement = ({ fixtureId, closeModal }) => {
  const queryClient = useQueryClient();
  const { currentRole } = useUser();
  const { data: fixture, isLoading } = useFixtureDetails(fixtureId);

  const { data: addresses } = useAddresses(currentRole?.district?.id);
  console.log('Addresses for district', currentRole?.district?.id, addresses);

  const isHomeVenue = fixture?.venue_id === null;
  const venueIdToUse = isHomeVenue ? fixture?.address?.id : fixture?.venue_id;

  const [dateTime, setDateTime] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [venueId, setVenueId] = useState(venueIdToUse);
  const selectedVenue = addresses?.find((a) => a.id === venueId);
  const selectedVenueLabel = selectedVenue
    ? [
        selectedVenue.name,
        selectedVenue.line_1,
        selectedVenue.line_2,
        selectedVenue.city,
        selectedVenue.postcode,
      ]
        .filter(Boolean)
        .join(', ')
    : 'Select Venue';

  const [openPicker, setOpenPicker] = useState(null);

  const venueOptions =
    addresses?.map((addr) => ({
      label: addr.name,
      value: addr.id,
      subLabel: [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(', '),
    })) || [];

  const togglePicker = useCallback((type) => {
    setOpenPicker((prev) => {
      if (prev === type) return null; // closing same — fine
      if (prev !== null) {
        // A different picker is open: close it first, then open the new one
        // after the native module has had a tick to clean up.
        setTimeout(() => setOpenPicker(type), 50);
        return null;
      }
      return type;
    });
  }, []);

  useEffect(() => {
    if (!fixture) return;
    if (fixture.date_time) setDateTime(new Date(fixture.date_time));
    if (fixture.address?.id && addresses?.some((a) => a.id === fixture.address.id)) {
      setVenueId(fixture.address.id);
    }
  }, [fixture, addresses]);

  // When the DATE portion changes: keep the existing hours/minutes.
  // This is what previously broke — iOS returned midnight UTC and
  // we were storing that raw, wiping out the time component.
  const handleDateChange = useCallback(
    (selected) => {
      const updated = new Date(selected);
      updated.setHours(dateTime.getHours(), dateTime.getMinutes(), 0, 0);
      setDateTime(updated);
    },
    [dateTime]
  );

  // When the TIME portion changes: keep the existing date.
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

  const formatTime = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const fixtureVenueId = fixture?.venue_id ?? fixture?.address?.id ?? null;

  const isDirty =
    (fixture?.date_time && new Date(fixture.date_time).getTime() !== dateTime.getTime()) ||
    (venueId ?? null) !== fixtureVenueId;

  const isIndividual = fixture?.competitor_type === 'individual';

  const isComplete = fixture?.is_complete;
  const isApproved = fixture?.approved;
  const isAmended = fixture?.is_amended;
  const isDisputed = fixture?.is_disputed;
  const isEscalated = fixture?.is_escalated;

  const getStatus = () => {
    let status1 = 'Error';
    let status2 = 'Unknown Status';
    let color = '#9CA3AF'; // default gray

    if (isComplete && !isApproved && isDisputed && !isAmended) {
      status1 = 'Disputed';
      status2 = 'Pending Home Amendment';
      color = '#F59E0B'; // orange
    }
    if (isComplete && !isApproved && !isDisputed && !isAmended) {
      status1 = 'Complete';
      status2 = 'Pending Away Approval';
      color = '#F59E0B';
    }
    if (isComplete && !isApproved && isAmended) {
      status1 = 'Amended';
      status2 = 'Pending Approval';
      color = '#F59E0B';
    }
    if (!isComplete && !isApproved) {
      status1 = 'Scheduled';
      status2 = 'Awaiting Results';
      color = '#3B82F6'; // blue
    }
    if (isEscalated && !isApproved) {
      status1 = 'Escalated';
      status2 = 'Requires Admin Intervention';
      color = '#EF4444'; // red
    }
    if (isComplete && isApproved) {
      status1 = 'Approved';
      status2 = 'Match Complete';
      color = '#10B981'; // green
    }

    return { status1, status2, color };
  };

  const status = getStatus();

  console.log('venueId:', venueId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('update_fixture_schedule', {
        p_fixture_id: fixtureId,
        p_date_time: dateTime.toISOString(),
        p_venue_id: venueId ?? null,
      });

      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries(['fixture-details', fixtureId]),
        queryClient.invalidateQueries([
          'fixtures-grouped',
          new Date(fixture?.date_time).getMonth(),
          fixture.season,
          fixture.competition_instance_id,
        ]),
        queryClient.invalidateQueries([
          'fixtures-grouped',
          new Date(dateTime).getMonth(),
          fixture.season,
          fixture.competition_instance_id,
        ]),
      ]);
      Toast.show({
        type: 'success',
        text1: 'Fixture Updated',
        text2: "The fixture's details have been successfully updated.",
      });
    } catch (error) {
      console.error('Error saving fixture:', error);

      Toast.show({
        type: 'error',
        text1: 'Error Updating Fixture',
        text2: error?.message || 'Something went wrong while updating the fixture.',
      });
    } finally {
      setIsSaving(false);
      closeModal();
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View className="flex-1">
      {/* Match header */}
      <View className="flex-row items-center justify-between gap-10 rounded-t-2xl bg-bg-3 p-3 shadow-sm">
        {/* Home */}
        <View className="items-start">
          <View className="flex-row items-center justify-start gap-4">
            {isIndividual ? (
              <Avatar size={40} player={fixture?.homeCompetitor} />
            ) : (
              <TeamLogo size={40} {...fixture?.homeCompetitor?.crest} />
            )}
            <Text
              style={{ lineHeight: 50 }}
              className={`font-saira-semibold ${isIndividual ? 'text-3xl' : 'text-4xl'}`}>
              {isIndividual
                ? fixture?.homeCompetitor?.nickname?.toUpperCase() ||
                  `(${fixture?.homeCompetitor?.first_name})`
                : fixture?.homeCompetitor?.abbreviation}
            </Text>
          </View>
          <Text className="pl-1 font-saira-medium text-lg text-text-2">
            {fixture?.homeCompetitor?.display_name}
          </Text>
        </View>

        {/* Away */}
        <View className="items-end">
          <View className="flex-row items-center justify-start gap-4">
            <Text
              style={{ lineHeight: 50 }}
              className={`font-saira-semibold ${isIndividual ? 'text-3xl' : 'text-4xl'}`}>
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
          <Text className="pr-1 font-saira-medium text-lg text-text-2">
            {fixture?.awayCompetitor?.display_name}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-bg-2"
        contentContainerStyle={{ flexGrow: 1, paddingTop: 8, gap: 8, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled">
        <View className="gap-2 bg-bg-1 p-5">
          {/* Fixture details summary */}
          <Heading text="Fixture Details" />

          <View className="gap-3 rounded-2xl bg-bg-2 p-4 shadow-sm">
            <View className="flex-row items-center gap-3">
              <Ionicons name="calendar-outline" size={22} color="purple" />
              <Text className="font-saira text-lg text-text-1">Date & Time</Text>
              <Text className="flex-1 text-right font-saira-medium text-lg text-text-1">
                {dateTime.toLocaleString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <View className="h-px bg-theme-gray-4" />

            <View className="flex-row items-start gap-3">
              <View className=" flex-row items-center gap-3">
                <Ionicons name="location-outline" size={22} color="purple" />
                <Text className="font-saira text-lg text-text-1">Location</Text>
              </View>
              <Text
                className={`flex-1 text-right font-saira-medium text-lg ${selectedVenueLabel === 'Select Venue' ? 'text-text-2' : 'text-text-1'}`}>
                {selectedVenueLabel}
              </Text>
            </View>

            <View className="h-px bg-theme-gray-4" />

            <View className="flex-row items-start gap-3">
              <View className=" flex-row items-center gap-3">
                <Ionicons name="radio-button-on-outline" size={22} color="purple" />
                <Text className="font-saira text-lg text-text-1">Status</Text>
              </View>
              <View className="flex-1 gap-1">
                <View className="flex-row items-center justify-end gap-2">
                  <View
                    className="rounded-full"
                    style={{
                      backgroundColor: status.color,
                      marginBottom: 2,
                      width: 14,
                      height: 14,
                    }}
                  />

                  <Text className="text-right font-saira-medium text-lg text-text-1">
                    {status.status1}
                  </Text>
                </View>
                <Text className="flex-1 text-right font-saira text-sm text-text-2">
                  {status.status2}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className="w-full gap-5 bg-bg-1 p-5">
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
        </View>
        <View className="w-full gap-5 bg-bg-1 p-5">
          <Heading text="Fixture Venue" />
          <CustomDropdown
            options={venueOptions}
            value={venueId}
            onChange={(val) => setVenueId(val)}
            leftIconName="location-outline"
            iconColor="purple"
            label="Select Venue"
            placeholder="Select a Venue..."
          />
        </View>
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 p-5 pb-8">
        <View
          style={{ borderRadius: 28 }}
          className="border border-theme-gray-3 bg-bg-1/80 p-5 shadow-md backdrop-blur-lg">
          <CTAButton
            text="Save Changes"
            disabled={!isDirty}
            type="yellow"
            loading={isSaving}
            callbackFn={handleSave}
          />
        </View>
      </View>
    </View>
  );
};

export default FixtureManagement;
