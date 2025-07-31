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
  const [district, setDistrict] = useState(currentRole?.team?.division?.district);
  const [season, setSeason] = useState(currentRole?.activeSeason);
  const [division, setDivision] = useState(currentRole?.team?.division);
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
    seasonId: season?.id,
    divisionId: division?.id,
  });

  const grouped = Object.entries(fixtureData ?? {});

  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className="bg-brand-dark p-4">
      {/* Filter Selectors */}
      <View className="mb-4 flex-row items-center justify-between gap-3">
        <DropdownFilterButton text={season?.name} callbackFn={() => {}} />
        <DropdownFilterButton text={district?.name} callbackFn={() => {}} />
        <DropdownFilterButton text={division?.name} callbackFn={() => {}} />
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
        <View className="mb-4 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-4">
          <View className="mb-8 h-8 w-16 rounded-xl bg-bg-grouped-3"></View>
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
        <View className="items-center justify-center gap-3 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 px-8 py-12">
          <Text className="text-center font-saira-medium text-xl text-text-1">{`No fixtures available for ${format(
            selectedMonth,
            'MMMM yyyy'
          )}.`}</Text>
          <Text className="text-center font-saira text-lg text-text-1">
            Try changing the filter or selecting a different month.
          </Text>
        </View>
      )}

      {/* Fixture List */}
      <FlatList
        showsVerticalScrollIndicator={false}
        data={grouped}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, fixtures] }) => (
          <View
            className="mb-4 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-2"
            key={date}>
            <Text className="mb-2 p-2 font-saira-semibold text-2xl text-text-1">
              {format(parseISO(date), 'EEE d MMM')}
            </Text>

            {fixtures.map((f, index) => {
              const isLive = new Date() >= new Date(f.date_time) && !f.is_complete;
              return (
                <Pressable
                  onPress={() => {
                    if (hasNavigated.current) return;
                    hasNavigated.current = true;
                    setTimeout(() => {
                      hasNavigated.current = false;
                    }, 750);
                    router.push(`/home/${f.id}`);
                  }}
                  className="mb-3 mt-2 items-center justify-center gap-2"
                  key={f.id}>
                  {isLive ? (
                    f.is_complete ? (
                      <Text className="mb-1 items-center justify-center gap-2 rounded-lg bg-theme-gray-5 px-2 py-0.5 text-center font-saira-medium text-lg text-text-1">
                        Final Score
                      </Text>
                    ) : (
                      <View className="mb-1 flex-row items-center justify-center gap-2 rounded-lg bg-theme-gray-5 px-2 py-0.5">
                        <View className="h-3 w-3 rounded-full bg-theme-red"></View>
                        <Text className="font-saira-medium text-text-1">Live</Text>
                      </View>
                    )
                  ) : null}
                  <View className="flex-row items-center justify-center gap-2 rounded-lg">
                    <Text className="flex-1 text-right font-saira-semibold text-lg text-text-1">
                      {f.home_team.abbreviation}
                    </Text>
                    <TeamLogo {...f.home_team.crest} size={20} />
                    {!isLive ? (
                      <Text className="pt-1 text-right font-saira-semibold text-xl text-text-1">
                        {f.home_score ?? '0'} : {f.away_score ?? '0'}
                      </Text>
                    ) : (
                      <Text className="w-16 text-center font-saira-medium text-lg text-text-1">
                        {format(new Date(f.date_time), 'HH:mm')}
                      </Text>
                    )}
                    <TeamLogo {...f.away_team.crest} size={20} />
                    <Text className="flex-1 text-left font-saira-semibold text-lg text-text-1">
                      {f.away_team.abbreviation}
                    </Text>
                  </View>
                  <View className="w-full flex-row items-center justify-center">
                    <Text className="flex-1 text-right font-saira text-text-1">
                      {f.home_team.display_name}
                    </Text>
                    <Text
                      className="mx-2 w-8 text-center font-saira text-lg text-text-2
                    ">
                      vs
                    </Text>
                    <Text className="flex-1 text-left font-saira text-text-1">
                      {f.away_team.display_name}
                    </Text>
                  </View>
                  {index !== fixtures.length - 1 && (
                    <View className="mt-2 h-[1px] w-[80%] bg-theme-gray-5" />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      />
    </View>
  );
};

export default FixtureList;
