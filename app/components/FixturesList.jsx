import { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useMonthlyFixtures } from '@/hooks/useGroupedFixtures';
import { format, addMonths, parseISO, startOfMonth, isBefore } from 'date-fns';
import IonIcons from 'react-native-vector-icons/Ionicons';
import TeamLogo from './TeamLogo';
import { useUser } from '@/contexts/UserProvider';
import DropdownFilterButton from './DropdownFilterButton';
import { useRouter } from 'expo-router';
import { FixtureSkeleton } from '@components/Skeletons';

const FixtureList = () => {
  const router = useRouter();
  const { currentRole } = useUser();
  const seasonId = currentRole?.activeSeason?.id;
  const divisionId = currentRole?.team?.division?.id;
  const seasonStartDate = currentRole?.activeSeason?.start_date;
  const hasNavigated = useRef(false);

  const initialMonth = isBefore(new Date(), seasonStartDate)
    ? startOfMonth(seasonStartDate)
    : startOfMonth(new Date());

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const {
    data: fixtureData,
    isFetching,
    error,
  } = useMonthlyFixtures({
    month: selectedMonth,
    seasonId,
    divisionId,
  });

  const grouped = Object.entries(fixtureData ?? {});

  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className="bg-brand-dark p-4">
      {/* Filter Selectors */}
      <View className="mb-4 flex-row items-center justify-between gap-3">
        <DropdownFilterButton text="Season" callbackFn={() => {}} />
        <DropdownFilterButton text="District" callbackFn={() => {}} />
        <DropdownFilterButton text="Division" callbackFn={() => {}} />
      </View>

      {/* Month Selector */}
      <View className="mb-4 flex-row items-center justify-center gap-8">
        <Pressable
          onPress={() => setSelectedMonth((prev) => addMonths(prev, -1))}
          className="rounded-full bg-brand-light p-2">
          <IonIcons name="chevron-back" size={24} color="white" />
        </Pressable>

        <Text className="w-56 pt-2 text-center font-saira-semibold text-xl text-white">
          {format(selectedMonth, 'MMMM yyyy')}
        </Text>

        <Pressable
          onPress={() => setSelectedMonth((prev) => addMonths(prev, 1))}
          className="rounded-full bg-brand-light p-2">
          <IonIcons name="chevron-forward" size={24} color="white" />
        </Pressable>
      </View>

      {/* Loading Skeleton */}
      {isFetching && (
        <View className="mb-4">
          <FixtureSkeleton />
          <FixtureSkeleton />
          <FixtureSkeleton />
          <FixtureSkeleton />
          <FixtureSkeleton />
          <FixtureSkeleton />
          <FixtureSkeleton />
          <FixtureSkeleton />
        </View>
      )}

      {/* No Fixtures */}
      {grouped.length === 0 && !isFetching && (
        <View className="items-center justify-center gap-3 rounded-2xl bg-brand px-8 py-12">
          <Text className="text-center font-saira-medium text-xl text-white">{`No fixtures available for ${format(
            selectedMonth,
            'MMMM yyyy'
          )}.`}</Text>
          <Text className="text-center font-saira text-lg text-white">
            Try changing the filter or selecting a different month.
          </Text>
        </View>
      )}

      {/* Fixture List */}
      <FlatList
        showsVerticalScrollIndicator={false}
        className="bg-brand-dark"
        data={grouped}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, fixtures] }) => (
          <View className="mb-4 rounded-2xl bg-brand p-2" key={date}>
            <Text className="mb-2 p-2 font-saira-semibold text-2xl text-white">
              {format(parseISO(date), 'EEE d MMM')}
            </Text>

            {fixtures.map((f) => (
              <Pressable
                onPress={() => {
                  if (hasNavigated.current) return;
                  hasNavigated.current = true;
                  setTimeout(() => {
                    hasNavigated.current = false;
                  }, 750);
                  router.push(`/home/${f.id}`);
                }}
                className="my-3 items-center justify-center gap-2"
                key={f.id}>
                <View className="flex-row items-center justify-center gap-2 rounded-lg bg-brand">
                  <Text className="flex-1 text-right font-saira-semibold text-lg text-white">
                    {f.home_team.abbreviation}
                  </Text>
                  <TeamLogo {...f.home_team.crest} size={20} />
                  <Text className="w-16 text-center font-saira-medium text-lg text-white">
                    {format(new Date(f.date_time), 'HH:mm')}
                  </Text>
                  <TeamLogo {...f.away_team.crest} size={20} />
                  <Text className="flex-1 text-left font-saira-semibold text-lg text-white">
                    {f.away_team.abbreviation}
                  </Text>
                </View>
                <View className="w-full flex-row items-center justify-center">
                  <Text className="flex-1 text-right font-saira text-white">
                    {f.home_team.display_name}
                  </Text>
                  <Text className="mx-2 w-8 text-center font-saira text-lg text-white">vs</Text>
                  <Text className="flex-1 text-left font-saira text-white">
                    {f.away_team.display_name}
                  </Text>
                </View>
                <View className="mt-2 h-[1px] w-[70%] bg-brand-light" />
              </Pressable>
            ))}
          </View>
        )}
      />
    </View>
  );
};

export default FixtureList;
