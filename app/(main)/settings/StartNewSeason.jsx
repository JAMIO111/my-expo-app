import { Text, View, ScrollView, Pressable, Platform } from 'react-native';
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
import { useColorScheme } from 'nativewind';
import { colors } from '@lib/colors'; // Adjust the import path as necessary

const StartNewSeason = () => {
  const { colorScheme } = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors?.dark : colors?.light; // Adjust based on your theme
  const [seasonStartModalVisible, setSeasonStartModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const handleConfirmSeasonStart = async () => {
    setSeasonStartModalVisible(false);
    try {
      // ✅ Get the new season ID
      const newSeasonId = await initiateNewSeason(
        '2025/26',
        'e6301d1e-e017-4c7e-9883-8dc1e57a313b'
      );

      if (!newSeasonId) {
        console.error('Failed to initiate season');
        return;
      }

      console.log('New season ID:', newSeasonId);

      // ✅ Fetch all divisions for that district
      const { data: divisions, error: divisionError } = await supabase
        .from('Divisions')
        .select('id')
        .eq('district', 'e6301d1e-e017-4c7e-9883-8dc1e57a313b');

      console.log('Divisions:', divisions);

      if (divisionError || !divisions) {
        console.error('Failed to fetch divisions:', divisionError?.message);
        return;
      }

      const matchDays = ['Monday']; // ✅ define your match days (or fetch them if dynamic)

      for (const division of divisions) {
        const { data: teams, error: teamError } = await supabase
          .from('Teams')
          .select('id, display_name')
          .eq('division', division.id);

        if (teamError || !teams) {
          console.error(`Failed to fetch teams for division ${division.id}:`, teamError?.message);
          continue;
        }

        console.log(`Teams for division ${division.id}:`, teams);

        const teamIds = teams.map((t) => t.id);

        const fixtures = generateFixtures({
          teams: teamIds,
          startDate,
          matchDays,
          time: '21:30',
          divisionId: division.id,
          seasonId: newSeasonId,
          excludedRanges: [
            { start: '2025-12-20', end: '2026-01-06' }, // Christmas
            { start: '2026-04-10', end: '2026-04-17' }, // Easter
          ],
        });
        console.log(`Generated fixtures for division ${division.id}:`, fixtures);

        const { error: fixtureError } = await supabase.from('Fixtures').insert(fixtures);

        if (fixtureError) {
          console.error(
            `Failed to insert fixtures for division ${division.id}:`,
            fixtureError.message
          );
        }
      }

      console.log('Season started and fixtures generated.');
    } catch (err) {
      console.error('Unexpected error during season start:', err);
    }
  };

  const handleCancel = () => {
    setSeasonStartModalVisible(false);
  };
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Start New Season',
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem
            iconBGColor="gray"
            title="Season Name"
            icon="text-outline"
            text={`${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(-2)}`}
          />
          <SettingsItem
            routerPath="settings/LeagueConfig/Divisions"
            iconBGColor="gray"
            title="Selected Divisions"
            icon="podium-outline"
            text={'3 Divisions'}
          />
        </MenuContainer>
        <MenuContainer>
          <SettingsItem
            routerPath="settings/LeagueConfig/Divisions"
            iconBGColor="red"
            title="Match Frequency"
            icon="pulse-outline"
            text={'1 per Week'}
          />
          <SettingsItem
            routerPath="settings/MatchDays"
            iconBGColor="red"
            title="Match Days"
            icon="today-outline"
            text={'Mondays'}
          />
          <SettingsItem
            routerPath="settings/LeagueConfig/Divisions"
            iconBGColor="red"
            title="Match Times"
            icon="time-outline"
            text={'3 Divisions'}
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
                  {startDate.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  })}
                </Text>
                <IonIcons
                  name={showDatePicker ? 'chevron-down' : 'chevron-forward'}
                  size={18}
                  color={themeColors?.icon}
                />
              </View>
            </Pressable>

            {showDatePicker && (
              <View className="px-4 pb-2">
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }

                    if (selectedDate) {
                      setStartDate(selectedDate);
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
            text={`Initiate ${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(-2)} Season`}
            callbackFn={() => setSeasonStartModalVisible(true)}
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
            message={`Are you sure you want to start the ${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(-2)} season? This action cannot be undone.`}
          />
        </View>
      </ScrollView>
    </>
  );
};

export default StartNewSeason;
