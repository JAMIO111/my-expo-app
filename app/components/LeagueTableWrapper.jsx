import { StyleSheet, ScrollView, View, Text } from 'react-native';
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

const LeagueTableWrapper = ({ context }) => {
  const { player } = useUser();

  const defaultDistrict = player?.team?.division?.district?.id ?? null;
  const defaultDivision = player?.team?.division?.id ?? null;
  const defaultSeason = player?.activeSeason?.id ?? null;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(defaultDivision);
  const [season, setSeason] = useState(defaultSeason);

  const bottomSheetRef = useRef(null);
  const openSheet = () => {
    if (bottomSheetRef.current) {
      console.log('Opening Bottom Sheet...'); // ✅ Sanity check
      bottomSheetRef.current.expand(); // ✅ Calls expand method
    } else {
      console.warn('BottomSheet ref is null!');
    }
  };
  const closeSheet = () => bottomSheetRef.current?.close();

  const {
    data: districts = [],
    isLoading: isDistrictsLoading,
    error: districtsError,
  } = useDistricts();

  const {
    data: divisions = [],
    isLoading: isDivisionsLoading,
    error: divisionsError,
  } = useDivisions(district);

  const {
    data: seasons = [],
    isLoading: isSeasonsLoading,
    error: seasonsError,
  } = useSeasons(district);

  // When district changes: reset division + season, fetch active season
  useEffect(() => {
    if (!district) {
      setDivision(null);
      setSeason(null);
      return;
    }

    const init = async () => {
      const active = await getActiveSeason(district);
      setSeason(active);
    };

    setDivision(null);
    setSeason(null);
    init();
  }, [district]);

  // Set default division only when divisions are loaded
  useEffect(() => {
    if (divisions.length && defaultDivision && !division) {
      const found = divisions.find((d) => d.id === defaultDivision);
      if (found) setDivision(found.id);
    }
  }, [divisions, defaultDivision, division]);

  // Loading / error fallback
  if (isDistrictsLoading || isDivisionsLoading || isSeasonsLoading) {
    return <Text>Loading...</Text>;
  }

  if (districtsError || divisionsError || seasonsError) {
    console.error('Error loading data:', districtsError, divisionsError, seasonsError);
    return <Text>Error loading data</Text>;
  }

  return (
    <View className="flex-1 ">
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}
        className="w-full flex-1 bg-brand-dark">
        <View className="h-fit w-full items-center justify-between gap-3 border-b border-brand bg-brand-dark p-3">
          <View className="flex-row gap-3">
            <DropdownFilterButton text="District" callbackFn={openSheet} />
          </View>
          <View className="flex-row gap-3">
            <DropdownFilterButton text="Division" callbackFn={openSheet} />
            <DropdownFilterButton text="Season" callbackFn={openSheet} />
          </View>
        </View>

        <LeagueTable context={context} season={season} division={division} />
      </ScrollView>
      <BottomSheetWrapper ref={bottomSheetRef} snapPoints={['25%', '50%']}>
        <Text>This content can be anything!</Text>
        <CTAButton title="Close" callbackFn={closeSheet} />
      </BottomSheetWrapper>
    </View>
  );
};

export default LeagueTableWrapper;

const styles = StyleSheet.create({});
