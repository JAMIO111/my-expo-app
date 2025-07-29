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
  const { player, currentRole } = useUser();

  // Default full objects from context
  const defaultDistrict = currentRole?.team?.division?.district ?? null;
  const defaultDivision = currentRole?.team?.division ?? null;
  const defaultSeason = currentRole?.activeSeason ?? null;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(defaultDivision);
  const [season, setSeason] = useState(defaultSeason);

  const bottomSheetRef = useRef(null);
  const openSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  };
  const closeSheet = () => bottomSheetRef.current?.close();

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
            <DropdownFilterButton text="District" callbackFn={openSheet} />
          </View>
          <View className="flex-row gap-3">
            <DropdownFilterButton text="Division" callbackFn={openSheet} />
            <DropdownFilterButton text="Season" callbackFn={openSheet} />
          </View>
        </View>

        {/* Pass IDs down to LeagueTable */}
        <LeagueTable context={context} season={season?.id} division={division?.id} />
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
