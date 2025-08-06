import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import LeagueTable from '@components/LeagueTable';
import { getActiveSeason } from '@lib/helperFunctions';
import { useUser } from '@contexts/UserProvider';
import { useDistricts } from '@hooks/useDistricts';
import { useDivisions } from '@hooks/useDivisions';
import { useSeasons } from '@hooks/useSeasons';
import CTAButton from './CTAButton';
import BottomSheetWrapper from './BottomSheetWrapper';
import DropdownFilterButton from './DropdownFilterButton';
import IonIcons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';

const LeagueTableWrapper = ({ context }) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined
  const { player, currentRole } = useUser();

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

  const [activeFilter, setActiveFilter] = useState(null);

  const bottomSheetRef = useRef(null);

  const openSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    console.log('Closing sheet...'); // Add this
    bottomSheetRef.current?.close();
  };

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

  // Loading or error fallback
  if (isDistrictsLoading || isDivisionsLoading || isSeasonsLoading) {
    return <Text>Loading...</Text>;
  }

  if (districtsError || divisionsError || seasonsError) {
    console.error('Error loading data:', districtsError, divisionsError, seasonsError);
    return <Text>Error loading data</Text>;
  }

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}
        className="w-full flex-1 bg-brand-dark">
        <View className="h-fit w-full items-center justify-between gap-3 border-b border-brand bg-brand-dark p-3">
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

        {/* Pass IDs down to LeagueTable */}
        <LeagueTable context={context} season={season?.id} division={division?.id} />
      </ScrollView>

      <BottomSheetWrapper ref={bottomSheetRef} initialIndex={-1} snapPoints={['90%']}>
        <View className="w-full flex-1 justify-between">
          <View className="flex-1 p-8">
            <Text className="mb-6 w-full text-left font-saira-semibold text-3xl text-text-1">
              {activeFilter === 'district'
                ? 'Districts'
                : activeFilter === 'division'
                  ? 'Divisions'
                  : activeFilter === 'season'
                    ? 'Seasons'
                    : ''}
            </Text>

            <ScrollView className="w-full">
              <View className="flex-1 gap-4">
                {activeFilter === 'district' &&
                  districts.map((d) => (
                    <Pressable
                      className="flex-row items-center justify-between"
                      key={d.id}
                      onPress={() => {
                        setTempDistrict(d);
                      }}>
                      <Text
                        className={`font-saira text-2xl ${
                          tempDistrict?.id === d.id ? 'text-text-1' : 'text-text-2'
                        }`}>
                        {d.name}
                      </Text>
                      <IonIcons
                        size={24}
                        color={themeColors.primaryText}
                        name={tempDistrict?.id === d.id ? 'checkbox' : 'square-outline'}
                      />
                    </Pressable>
                  ))}

                {activeFilter === 'division' &&
                  divisions.map((d) => (
                    <Pressable
                      className="flex-row items-center justify-between"
                      key={d.id}
                      onPress={() => {
                        setTempDivision(d);
                      }}>
                      <Text
                        className={`font-saira text-2xl  ${
                          tempDivision?.id === d.id ? 'text-text-1' : 'text-text-2'
                        }`}>
                        {d.name}
                      </Text>
                      <IonIcons
                        name={tempDivision?.id === d.id ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={themeColors.primaryText}
                      />
                    </Pressable>
                  ))}

                {activeFilter === 'season' &&
                  seasons.map((s) => (
                    <Pressable
                      className="flex-row items-center justify-between"
                      key={s.id}
                      onPress={() => {
                        setTempSeason(s);
                      }}>
                      <Text
                        className={`font-saira text-2xl ${
                          tempSeason?.id === s.id ? 'text-text-1' : 'text-text-2'
                        }`}>
                        {s.name}
                      </Text>
                      <IonIcons
                        name={tempSeason?.id === s.id ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={themeColors.primaryText}
                      />
                    </Pressable>
                  ))}
              </View>
            </ScrollView>
          </View>
          <View className="w-full rounded-t-2xl bg-bg-grouped-3 p-8">
            <CTAButton
              text="Save"
              type="brand"
              callbackFn={() => {
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
              }}
            />
          </View>
        </View>
      </BottomSheetWrapper>
    </View>
  );
};

export default LeagueTableWrapper;

const styles = StyleSheet.create({});
