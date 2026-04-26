import { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import TeamLogo from './TeamLogo';
import Avatar from './Avatar';
import { ScrollView } from 'react-native-gesture-handler';
import LoadingScreen from './LoadingScreen';
import CTAButton from './CTAButton';
import DateTimePicker from '@react-native-community/datetimepicker';

const FixtureManagement = ({ fixtureId }) => {
  const { data: fixture, isLoading } = useFixtureDetails(fixtureId);
  console.log('FixtureManagement - fixture details:', fixture);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  // combine date + time into one value
  const getCombinedDateTime = () => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(0);
    return combined;
  };

  useEffect(() => {
    if (fixture?.date_time) {
      const dt = new Date(fixture.date_time);
      setDate(dt);
      setTime(dt);
    }
  }, [fixture?.date_time]);

  if (isLoading) return <LoadingScreen />;
  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between gap-10 rounded-t-2xl bg-bg-3 p-3 shadow-sm">
        <View className="items-start">
          <View className="flex-row items-center justify-start gap-4">
            {fixture?.competitor_type === 'individual' ? (
              <Avatar size={40} player={fixture?.homeCompetitor} />
            ) : (
              <TeamLogo size={40} {...fixture?.homeCompetitor?.crest} />
            )}
            <Text
              style={{ lineHeight: 50 }}
              className={`font-saira-semibold ${fixture?.competitor_type === 'individual' ? 'text-3xl' : 'text-4xl'}`}>
              {fixture?.competitor_type === 'individual'
                ? fixture?.homeCompetitor?.nickname?.toUpperCase() ||
                  `(${fixture?.homeCompetitor?.first_name})`
                : fixture?.homeCompetitor?.abbreviation}
            </Text>
          </View>
          <Text className="pl-1 font-saira-medium text-lg text-text-2">
            {fixture?.homeCompetitor?.display_name}
          </Text>
        </View>

        <View className="items-end">
          <View className="flex-row items-center justify-start gap-4">
            <Text
              style={{ lineHeight: 50 }}
              className={`font-saira-semibold ${fixture?.competitor_type === 'individual' ? 'text-3xl' : 'text-4xl'}`}>
              {fixture?.competitor_type === 'individual'
                ? fixture?.awayCompetitor?.nickname?.toUpperCase() ||
                  `(${fixture?.awayCompetitor?.first_name})`
                : fixture?.awayCompetitor?.abbreviation}
            </Text>
            {fixture?.competitor_type === 'individual' ? (
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

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingTop: 2 }}>
        <View className="w-full items-center gap-5 p-3">
          <View className="w-full items-center justify-center rounded-2xl bg-bg-2 shadow-sm">
            <DateTimePicker
              value={date}
              minimumDate={new Date(2000, 0, 1)}
              maximumDate={new Date(2100, 11, 31)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => {
                if (event.type === 'set' && selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          </View>
          <View className="w-full items-center justify-center rounded-2xl bg-bg-2 shadow-sm">
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                if (event.type === 'set' && selectedTime) {
                  setTime(selectedTime);
                }
              }}
            />
          </View>
          <Text className="font-saira-medium text-2xl">Fixture Details</Text>
          <Text className="font-saira text-lg">
            Date: {date.toLocaleDateString()} {time.toLocaleTimeString()}
          </Text>
          <Text className="font-saira text-lg">Location: {fixture?.location || 'TBD'}</Text>
          <Text className="font-saira text-lg">Status: {fixture?.status || 'TBD'}</Text>
        </View>
      </ScrollView>
      <View className="p-3 pb-16">
        <CTAButton text="Save Changes" type="yellow" callbackFn={() => {}} />
      </View>
    </View>
  );
};

export default FixtureManagement;
