import { Text, View, ScrollView, Pressable, Platform, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import CTAButton from '@components/CTAButton';
import ConfirmModal from '@components/ConfirmModal';
import { initiateNewSeason, generateFixtures } from '@/lib/helperFunctions'; // Adjust the import path as necessary
import { useState } from 'react';
import supabase from '@lib/supabaseClient'; // Adjust the import path as necessary
import DateTimePicker from '@react-native-community/datetimepicker';
import IonIcons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useFixtureConfig } from '@contexts/AdminContext'; // Adjust the import path as necessary
import colors from '@lib/colors'; // Adjust the import path as necessary
import { useUser } from '@contexts/UserProvider'; // Adjust the import path as necessary
import { matchFrequencyOptions } from '@lib/fixtureOptions'; // Adjust the import path as necessary
import { matchDaysOptions } from '@lib/fixtureOptions'; // Adjust the import path as necessary
import SafeViewWrapper from '@components/SafeViewWrapper'; // Adjust the import path as necessary
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router'; // Adjust the import path as necessary

const StartNewSeason = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { player, currentRole } = useUser();
  const ctx = useFixtureConfig();
  console.log('FixtureConfig context:', ctx);

  if (!ctx) {
    return <div>Loading or no config available</div>;
  }

  const { fixtureConfig, setFixtureConfig } = ctx;

  // If fixtureConfig is undefined, you can do:
  if (!fixtureConfig) {
    return <div>Loading config...</div>;
  }
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];
  const districtId = currentRole?.team?.division?.district?.id;
  const [seasonStartModalVisible, setSeasonStartModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const handleConfirmSeasonStart = async () => {
    setIsLoading(true);
    setSeasonStartModalVisible(false);

    try {
      // 1. Create new season
      const newSeasonId = await initiateNewSeason('2025/26', districtId, fixtureConfig.startDate);

      if (!newSeasonId) {
        console.error('Failed to initiate season');
        setIsLoading(false);
        return;
      }

      // 2. Fetch divisions
      const { data: divisions, error: divisionError } = await supabase
        .from('Divisions')
        .select('id')
        .eq('district', districtId);

      if (divisionError || !divisions) {
        console.error('Failed to fetch divisions:', divisionError?.message);
        setIsLoading(false);
        return;
      }

      let earliestSeasonStart = null;
      const divisionIds = []; // to collect all division IDs for invalidation

      // 3. Loop through each division
      for (const division of divisions) {
        divisionIds.push(division.id);

        const { data: teams, error: teamError } = await supabase
          .from('Teams')
          .select('id, display_name')
          .eq('division', division.id);

        if (teamError || !teams) {
          console.error(`Failed to fetch teams for division ${division.id}:`, teamError?.message);
          continue;
        }

        const teamIds = teams.map((t) => t.id);

        const { fixtures, earliestMatchDate } = generateFixtures({
          teams: teamIds,
          frequency: fixtureConfig.frequency,
          reverseGapWeeks: fixtureConfig.reverseGapWeeks,
          startDate: fixtureConfig.startDate,
          matchDays: fixtureConfig.matchDays,
          monthlyMatchDays: fixtureConfig.monthlyMatchDays,
          matchTimes: fixtureConfig.matchTimes,
          divisionId: division.id,
          seasonId: newSeasonId,
          excludedRanges: fixtureConfig.excludedRanges,
        });

        if (
          earliestMatchDate &&
          (!earliestSeasonStart || new Date(earliestMatchDate) < new Date(earliestSeasonStart))
        ) {
          earliestSeasonStart = earliestMatchDate;
        }

        const { error: fixtureError } = await supabase.from('Fixtures').insert(fixtures);

        if (fixtureError) {
          console.error(
            `Failed to insert fixtures for division ${division.id}:`,
            fixtureError.message
          );
        }
      }

      // 4. Update season with calculated start date
      if (earliestSeasonStart) {
        const { error: updateError } = await supabase
          .from('Seasons')
          .update({ start_date: earliestSeasonStart })
          .eq('id', newSeasonId);

        if (updateError) {
          console.error('Failed to update season start date:', updateError.message);
        }
      }

      // 5. Invalidate all related fixture caches
      queryClient.invalidateQueries({
        predicate: (query) => {
          if (!Array.isArray(query.queryKey)) return false;

          const [key, _month, querySeasonId, queryDivisionId] = query.queryKey;

          return (
            key === 'fixtures-grouped' &&
            querySeasonId === newSeasonId &&
            divisionIds.includes(queryDivisionId)
          );
        },
      });

      console.log('Season started and fixtures generated.');
      setIsLoading(false);

      // 6. Navigate away
      router.replace('/(main)/home');
    } catch (err) {
      console.error('Unexpected error during season start:', err);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSeasonStartModalVisible(false);
  };
  console.log('FixtureConfig:', fixtureConfig);
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <View className="h-16 flex-row items-center justify-center bg-brand">
                <Text className="font-michroma text-2xl font-bold text-white">
                  Start New Season
                </Text>
              </View>
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem
            iconBGColor="gray"
            title="Season Name"
            icon="text-outline"
            disabled={true}
            text={`${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(-2)}`}
          />
          <SettingsItem
            routerPath="settings/LeagueConfig/Divisions"
            iconBGColor="gray"
            title="Selected Divisions"
            icon="podium-outline"
            text={'3 Divisions'}
            lastItem={true}
          />
        </MenuContainer>
        <MenuContainer>
          <SettingsItem
            routerPath="settings/MatchFrequency"
            iconBGColor="red"
            title="Match Frequency"
            icon="pulse-outline"
            text={
              matchFrequencyOptions.find((opt) => opt.value === fixtureConfig.frequency)?.label ??
              'Select Frequency'
            }
          />
          <SettingsItem
            routerPath="settings/MatchDays"
            iconBGColor="red"
            title="Match Days"
            icon="today-outline"
            text={
              fixtureConfig.frequency?.startsWith('monthly')
                ? fixtureConfig.monthlyMatchDays?.length > 0
                  ? fixtureConfig.monthlyMatchDays
                      .map(({ week, day }) => {
                        const ordinal = ['1st', '2nd', '3rd', '4th'][week - 1];
                        const dayAbbrev = day.charAt(0).toUpperCase() + day.slice(1, 3); // e.g. Mon, Tue
                        return `${ordinal} ${dayAbbrev}`;
                      })
                      .join(', ')
                  : 'Select Match Days'
                : fixtureConfig.matchDays?.length > 0
                  ? fixtureConfig.matchDays
                      .map((val) => {
                        const label = matchDaysOptions.find((opt) => opt.value === val)?.label;
                        return label ? label.slice(0, 3) : null;
                      })
                      .filter(Boolean)
                      .join(', ')
                  : 'Select Match Days'
            }
          />
          <SettingsItem
            routerPath="settings/MatchTimes"
            iconBGColor="red"
            title="Match Times"
            icon="time-outline"
            text={
              fixtureConfig?.matchTimes && fixtureConfig.matchTimes.length > 0
                ? fixtureConfig.matchTimes
                    .map((date) => {
                      if (!date) return 'N/A';
                      const timeString = new Date(date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return timeString;
                    })
                    .join(', ')
                : 'Select Match Times'
            }
          />
          <SettingsItem
            routerPath="settings/ExcludedDates"
            iconBGColor="red"
            title="Excluded Dates"
            icon="airplane-outline"
            text={
              Array.isArray(fixtureConfig.excludedRanges) && fixtureConfig.excludedRanges.length > 0
                ? fixtureConfig.excludedRanges.length === 1
                  ? (() => {
                      const range = fixtureConfig.excludedRanges[0];
                      if (!range.startDate || !range.endDate) return 'No Excluded Dates';
                      const start = new Date(range.startDate).toLocaleDateString('en-GB', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                      });
                      const end = new Date(range.endDate).toLocaleDateString('en-GB', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                      });
                      return `${start} - ${end}`;
                    })()
                  : `${fixtureConfig.excludedRanges.length} date ranges`
                : 'No Excluded Dates'
            }
          />
          <View className="w-full rounded-2xl bg-bg-grouped-2">
            <Pressable
              onPress={() => setShowDatePicker((prev) => !prev)}
              className="flex-row items-center justify-between px-4 py-4">
              <View
                className="h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: 'red' }}>
                <IonIcons name="calendar" size={22} color="white" />
              </View>
              <Text className="pl-5 text-lg font-medium text-text-1">Start of Season</Text>
              <View className="flex-1 flex-row items-center justify-end gap-3">
                <Text className="text-lg text-text-2">
                  {fixtureConfig.startDate.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  })}
                </Text>
                <IonIcons
                  name={showDatePicker ? 'chevron-down' : 'chevron-forward'}
                  size={18}
                  color={themeColors.icon}
                />
              </View>
            </Pressable>

            {showDatePicker && (
              <View className="px-4 pb-2">
                <DateTimePicker
                  value={fixtureConfig.startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }

                    if (selectedDate) {
                      setFixtureConfig((prev) => ({
                        ...prev,
                        startDate: selectedDate,
                      }));
                      if (Platform.OS === 'ios') {
                        // On iOS inline, close manually on selection
                        setTimeout(() => setShowDatePicker(false), 150);
                      }
                    }
                  }}
                  minimumDate={new Date()}
                />
              </View>
            )}
          </View>
        </MenuContainer>

        <View className="mb-16 w-full">
          <CTAButton
            text={
              isLoading
                ? `Initiating Season...`
                : `Initiate ${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(-2)} Season`
            }
            callbackFn={() => {
              const isWeekly = fixtureConfig.frequency?.startsWith('weekly');
              const isMonthly = fixtureConfig.frequency?.startsWith('monthly');
              //contains string twice or once
              const numberOfMatchDays = fixtureConfig?.frequency?.includes('twice') ? 2 : 1;

              const isValid =
                fixtureConfig?.frequency &&
                (isWeekly
                  ? fixtureConfig.matchDays.length === numberOfMatchDays
                  : fixtureConfig.monthlyMatchDays.length === numberOfMatchDays) &&
                (isWeekly
                  ? fixtureConfig.matchTimes.length === fixtureConfig.matchDays.length
                  : fixtureConfig.matchTimes.length === fixtureConfig.monthlyMatchDays.length);

              if (!isValid) {
                Toast.show({
                  type: 'info',
                  text1: 'Warning!',
                  text2: 'Ensure all settings are configured first.',
                  props: {
                    colorScheme,
                  },
                });
              } else {
                setSeasonStartModalVisible(true);
              }
            }}
            type="info"
          />
          <Text className="mt-4 text-center text-text-2">
            This will create a new season starting on the date selected date. League tables will be
            initiated and fixtures will be generated. Please ensure all teams are in the correct
            league and settings such as match day, match time, and match frequency have been
            configured before proceeding.
          </Text>
          <ConfirmModal
            visible={seasonStartModalVisible}
            onConfirm={handleConfirmSeasonStart}
            onCancel={handleCancel}
            title="Here we go!"
            message={`Are you sure you want to start the ${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(-2)} season?`}
          />
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default StartNewSeason;
