import { ScrollView, Platform, View, Text, Pressable, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import MenuContainer from '@components/MenuContainer';
import { useFixtureConfig } from '@contexts/AdminContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import IonIcons from 'react-native-vector-icons/Ionicons';
import colors from '@lib/colors';

const MatchTimes = () => {
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];
  const { fixtureConfig, setFixtureConfig } = useFixtureConfig();
  const [expandedDay, setExpandedDay] = useState(null);

  const formatTime = (date) =>
    date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const isMonthly = fixtureConfig.frequency?.startsWith('monthly');

  const matchDayItems = isMonthly
    ? (fixtureConfig.monthlyMatchDays ?? []).map(({ week, day }, idx) => {
        const key = `${week}_${day}`;
        const label = `${['1st', '2nd', '3rd', '4th'][week - 1]} ${day.charAt(0).toUpperCase() + day.slice(1)}`;
        return { key, label, idx };
      })
    : (fixtureConfig.matchDays ?? []).map((day, idx) => ({
        key: day,
        label: `${day.charAt(0).toUpperCase() + day.slice(1)} Matches`,
        idx,
      }));

  return (
    <>
      <Stack.Screen options={{ title: 'Match Time' }} />

      {!matchDayItems.length ? (
        <View
          className="bg-bg-grouped-1 p-5"
          style={{ flex: 1, justifyContent: 'start', alignItems: 'center' }}>
          <Text className="w-full rounded-2xl bg-bg-grouped-2 p-5 text-center text-lg font-medium text-text-1">
            No match times available for selection. Select match days first.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
          className="flex-1 bg-bg-grouped-1 p-5">
          <MenuContainer>
            {matchDayItems.map(({ key, label, idx }) => {
              const timeValue = fixtureConfig.matchTimes[idx];

              let parsedTime;

              if (timeValue instanceof Date) {
                parsedTime = timeValue;
              } else if (typeof timeValue === 'string') {
                const [hours, minutes] = timeValue.split(':').map(Number);
                parsedTime = new Date(1970, 0, 1, hours, minutes);
              } else {
                parsedTime = new Date(1970, 0, 1, 19, 0); // Default 19:00
              }

              const isExpanded = expandedDay === key;

              return (
                <View key={key} className="w-full rounded-2xl bg-bg-grouped-2">
                  <Pressable
                    onPress={() => setExpandedDay((prev) => (prev === key ? null : key))}
                    className="flex-row items-center justify-between px-4 py-4">
                    <View
                      className="h-9 w-9 items-center justify-center rounded-[10px]"
                      style={{ backgroundColor: 'red' }}>
                      <IonIcons name="time-outline" size={22} color="white" />
                    </View>
                    <Text className="pl-5 text-lg font-medium text-text-1">{label}</Text>
                    <View className="flex-1 flex-row items-center justify-end gap-3">
                      <Text className="text-lg text-text-2">{formatTime(parsedTime)}</Text>
                      <IonIcons
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                        size={18}
                        color={themeColors.icon}
                      />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View className="px-4 pb-2">
                      <DateTimePicker
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        value={parsedTime}
                        onChange={(event, date) => {
                          if (!date) return;

                          setFixtureConfig((prev) => {
                            const newMatchTimes = [...(prev.matchTimes || [])];
                            newMatchTimes[idx] = date;

                            return {
                              ...prev,
                              matchTimes: newMatchTimes,
                            };
                          });
                        }}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </MenuContainer>
        </ScrollView>
      )}
    </>
  );
};

export default MatchTimes;
