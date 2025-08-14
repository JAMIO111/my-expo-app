import { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, SafeAreaView, Animated } from 'react-native';
import { useMonthlyResults } from '@/hooks/useGroupedResults';
import { format, addMonths, parseISO, startOfMonth, isBefore } from 'date-fns';
import IonIcons from 'react-native-vector-icons/Ionicons';
import TeamLogo from '@components/TeamLogo';
import { useUser } from '@/contexts/UserProvider';
import DropdownFilterButton from '@components/DropdownFilterButton';
import { useRouter } from 'expo-router';
import { FixtureSkeleton } from '@components/Skeletons';
import BottomSheetWrapper from '@components/BottomSheetWrapper';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';
import { useDistricts } from '@hooks/useDistricts';
import { useDivisions } from '@hooks/useDivisions';
import { useSeasons } from '@hooks/useSeasons';
import { getActiveSeason } from '@lib/helperFunctions';

const ResultsList = () => {
  const router = useRouter();
  const { currentRole } = useUser();
  const seasonStartDate = currentRole?.activeSeason?.start_date;
  const hasNavigated = useRef(false);
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme

  const bottomSheetRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState(null);

  // Default full objects from context
  const defaultDistrict =
    currentRole?.role === 'admin'
      ? currentRole?.district
      : (currentRole?.team?.division?.district ?? null);
  const defaultDivision =
    currentRole?.role === 'admin' ? currentRole?.divisions[0] : currentRole?.team?.division;
  const defaultSeason = currentRole?.activeSeason ?? null;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(defaultDivision);
  const [season, setSeason] = useState(defaultSeason);
  const [tempDistrict, setTempDistrict] = useState(defaultDistrict);
  const [tempDivision, setTempDivision] = useState(defaultDivision);
  const [tempSeason, setTempSeason] = useState(defaultSeason);

  // Fetch districts (no id needed)
  const {
    data: districts = [],
    isLoading: isDistrictsLoading,
    error: districtsError,
  } = useDistricts();

  // Fetch divisions by district id
  const {
    data: divisions = [],
    isLoading: isDivisionsLoading,
    error: divisionsError,
  } = useDivisions(district?.id);

  // Fetch seasons by district id
  const {
    data: seasons = [],
    isLoading: isSeasonsLoading,
    error: seasonsError,
  } = useSeasons(district?.id);

  // When district changes: reset division + season, fetch active season object
  useEffect(() => {
    if (!district) {
      setDivision(null);
      setSeason(null);
      return;
    }

    const init = async () => {
      const active = await getActiveSeason(district?.id); // assume returns full season object
      setSeason(active);
    };

    setDivision(null);
    setSeason(null);
    init();
  }, [district]);

  // When divisions load, set default division if none selected yet
  useEffect(() => {
    if (divisions.length && defaultDivision && !division) {
      const found = divisions.find((d) => d.id === defaultDivision.id);
      if (found) setDivision(found);
    }
  }, [divisions, defaultDivision, division]);

  // When seasons load, set default season if none selected yet
  useEffect(() => {
    if (seasons.length && defaultSeason && !season) {
      const found = seasons.find((s) => s.id === defaultSeason.id);
      if (found) setSeason(found);
    }
  }, [seasons, defaultSeason, season]);

  const openSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const handleSave = () => {
    switch (activeFilter) {
      case 'district':
        setDistrict(tempDistrict);
        break;
      case 'division':
        setDivision(tempDivision);
        break;
      case 'season':
        setSeason(tempSeason);
        break;
    }
    closeSheet();
    setActiveFilter(null);
  };

  const initialMonth = isBefore(new Date(), seasonStartDate)
    ? startOfMonth(seasonStartDate)
    : startOfMonth(new Date());

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const {
    data: resultsData,
    isLoading,
    error,
  } = useMonthlyResults({
    month: selectedMonth,
    seasonId: season?.id,
    divisionId: division?.id,
  });

  const scaleAnimPrev = useRef(new Animated.Value(1)).current;
  const scaleAnimNext = useRef(new Animated.Value(1)).current;

  const handlePressIn = (anim) => {
    Animated.spring(anim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (anim) => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const grouped = Object.entries(resultsData ?? {});

  if (error)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
        <Text style={{ color: themeColors.primaryText, textAlign: 'center', marginTop: 20 }}>
          Error: {error.message}
        </Text>
      </SafeAreaView>
    );

  // Loading or error fallback
  if (isDistrictsLoading || isDivisionsLoading || isSeasonsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
        <Text style={{ color: themeColors.primaryText, textAlign: 'center', marginTop: 20 }}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  if (districtsError || divisionsError || seasonsError) {
    console.error('Error loading data:', districtsError, divisionsError, seasonsError);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
        <Text style={{ color: themeColors.primaryText, textAlign: 'center', marginTop: 20 }}>
          Error loading data
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="flex-1 px-4 pt-4">
        {/* Filter Selectors */}
        <View className="mb-4 h-fit w-full items-center justify-between gap-3 bg-brand-dark">
          <View className="flex-row gap-3">
            <DropdownFilterButton
              text={district?.name || 'Select District'}
              callbackFn={() => {
                setActiveFilter('district');
                openSheet();
              }}
            />
          </View>
          <View className="flex-row gap-3">
            <DropdownFilterButton
              text={division?.name || 'Select Division'}
              callbackFn={() => {
                setActiveFilter('division');
                openSheet();
              }}
            />
            <DropdownFilterButton
              text={season?.name || 'Select Season'}
              callbackFn={() => {
                setActiveFilter('season');
                openSheet();
              }}
            />
          </View>
        </View>

        {/* Month Selector */}
        <View className="mb-4 flex-row items-center justify-center gap-8">
          <Pressable
            onPressIn={() => handlePressIn(scaleAnimPrev)}
            onPressOut={() => handlePressOut(scaleAnimPrev)}
            onPress={() => setSelectedMonth((prev) => addMonths(prev, -1))}>
            <Animated.View
              className="rounded-full bg-brand-light p-2"
              style={{ transform: [{ scale: scaleAnimPrev }] }}>
              <IonIcons name="chevron-back" size={24} color="white" />
            </Animated.View>
          </Pressable>

          <Text className="w-56 pt-2 text-center font-saira-semibold text-xl text-white">
            {format(selectedMonth, 'MMMM yyyy')}
          </Text>

          <Pressable
            onPressIn={() => handlePressIn(scaleAnimNext)}
            onPressOut={() => handlePressOut(scaleAnimNext)}
            onPress={() => {
              setSelectedMonth((prev) => {
                const nextMonth = addMonths(prev, 1);
                const now = new Date();

                // If next month is after the current month, keep it as current
                if (
                  nextMonth.getFullYear() > now.getFullYear() ||
                  (nextMonth.getFullYear() === now.getFullYear() &&
                    nextMonth.getMonth() > now.getMonth())
                ) {
                  return prev; // don't update
                }
                return nextMonth;
              });
            }}>
            <Animated.View
              className="rounded-full bg-brand-light p-2"
              style={{ transform: [{ scale: scaleAnimNext }] }}>
              <IonIcons name="chevron-forward" size={24} color="white" />
            </Animated.View>
          </Pressable>
        </View>

        {/* Loading Skeleton */}
        {isLoading && (
          <View className="mb-4 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-4">
            <View className="mb-8 h-8 w-16 gap-3 rounded-xl bg-bg-grouped-3"></View>
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

        {/* No Results */}
        {grouped.length === 0 && !isLoading && (
          <View className="items-center justify-center gap-3 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 px-8 py-12">
            <Text className="text-center font-saira-medium text-xl text-text-1">{`No results available for ${format(
              selectedMonth,
              'MMMM yyyy'
            )}.`}</Text>
            <Text className="text-center font-saira text-lg text-text-1">
              Try changing the filter or selecting a different month.
            </Text>
          </View>
        )}

        {/* Results List */}
        <FlatList
          showsVerticalScrollIndicator={false}
          data={grouped}
          keyExtractor={([date]) => date}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item: [date, results], index }) => (
            <View
              className="mb-4 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-2"
              key={date}>
              <Text className="mb-2 p-2 font-saira-semibold text-2xl text-text-1">
                {format(parseISO(date), 'EEE d MMM')}
              </Text>

              {results.map((f, index) => {
                const isLive = new Date() >= new Date(f.date_time);
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
                    <View className="w-full flex-row items-center justify-between px-4">
                      <View className="flex-row items-center gap-3">
                        <TeamLogo {...f.home_team.crest} size={26} />

                        <Text className="font-saira-semibold text-xl text-text-1">
                          {f.home_team.abbreviation}
                        </Text>
                        <Text className="font-saira text-lg text-text-1">
                          {f.home_team.display_name}
                        </Text>
                      </View>
                      <Text
                        className={`${f.home_score > f.away_score ? 'font-saira-semibold' : 'font-saira'} w-12 text-center text-2xl text-text-1`}>
                        {f.home_score}
                      </Text>
                    </View>
                    <View className="w-full flex-row items-center justify-between px-4">
                      <View className="flex-row items-center gap-3">
                        <TeamLogo {...f.away_team.crest} size={26} />

                        <Text className="font-saira-semibold text-xl text-text-1">
                          {f.away_team.abbreviation}
                        </Text>
                        <Text className="font-saira text-lg text-text-1">
                          {f.away_team.display_name}
                        </Text>
                      </View>
                      <Text
                        className={`${f.away_score > f.home_score ? 'font-saira-semibold' : 'font-saira'} w-12 text-center text-2xl text-text-1`}>
                        {f.away_score}
                      </Text>
                    </View>
                    {index !== results.length - 1 && (
                      <View className="mt-2 h-[1px] w-[95%] bg-theme-gray-5" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      <BottomSheetWrapper
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['90%']}
        footerComponent={(props) => (
          <BottomSheetFooter {...props}>
            <View
              style={{ paddingBottom: 80 }}
              className="w-full rounded-t-3xl bg-bg-grouped-3 p-6">
              <CTAButton text="Save" type="brand" callbackFn={handleSave} />
            </View>
          </BottomSheetFooter>
        )}>
        {/* Fixed Header */}
        <BottomSheetView
          style={{
            paddingHorizontal: 32,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            backgroundColor: themeColors.bgGrouped2,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ lineHeight: 40 }} className="font-saira-medium text-3xl text-text-1">
            Select {activeFilter}
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        {/* Scrollable content with top padding to avoid overlap */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 240, paddingTop: 80, paddingHorizontal: 32 }}>
          {/* Your selectable items */}
          {activeFilter === 'district' &&
            districts.map((d) => (
              <Pressable
                className="mb-3 flex-row items-center justify-between"
                key={d.id}
                onPress={() => setTempDistrict(d)}>
                <Text
                  className={`font-saira text-2xl ${
                    tempDistrict?.id === d.id ? 'text-text-1' : 'text-text-2'
                  }`}>
                  {d.name}
                </Text>
                <Ionicons
                  size={24}
                  color={themeColors.primaryText}
                  name={tempDistrict?.id === d.id ? 'checkbox' : 'square-outline'}
                />
              </Pressable>
            ))}

          {activeFilter === 'division' &&
            divisions.map((d) => (
              <Pressable
                className="mb-3 flex-row items-center justify-between"
                key={d.id}
                onPress={() => setTempDivision(d)}>
                <Text
                  className={`font-saira text-2xl ${
                    tempDivision?.id === d.id ? 'text-text-1' : 'text-text-2'
                  }`}>
                  {d.name}
                </Text>
                <Ionicons
                  size={24}
                  color={themeColors.primaryText}
                  name={tempDivision?.id === d.id ? 'checkbox' : 'square-outline'}
                />
              </Pressable>
            ))}

          {activeFilter === 'season' &&
            seasons.map((s) => (
              <Pressable
                className="mb-3 flex-row items-center justify-between"
                key={s.id}
                onPress={() => setTempSeason(s)}>
                <Text
                  className={`font-saira text-2xl ${
                    tempSeason?.id === s.id ? 'text-text-1' : 'text-text-2'
                  }`}>
                  {s.name}
                </Text>
                <Ionicons
                  size={24}
                  color={themeColors.primaryText}
                  name={tempSeason?.id === s.id ? 'checkbox' : 'square-outline'}
                />
              </Pressable>
            ))}
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </View>
  );
};

export default ResultsList;
