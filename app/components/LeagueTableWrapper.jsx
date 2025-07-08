import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import LeagueTable from '@components/LeagueTable';
import ModalDropdown from '@components/ModalDropdown';
import { getActiveSeason } from '@lib/helperFunctions';
import { useUser } from '@contexts/UserProvider';
import { useDistricts } from '@hooks/useDistricts';
import { useDivisions } from '@hooks/useDivisions';
import { useSeasons } from '@hooks/useSeasons';

const LeagueTableWrapper = ({ context }) => {
  const { player } = useUser();

  const defaultDistrict = player?.team?.division?.district?.id ?? null;
  const defaultDivision = player?.team?.division?.id ?? null;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(null);
  const [season, setSeason] = useState(null);

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
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}
      className="w-full flex-1 bg-white">
      <View className="h-fit w-full items-center justify-between gap-3 bg-brand p-3">
        <View className="flex-row gap-3">
          <ModalDropdown
            value={district}
            onChange={setDistrict}
            placeholder="District"
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
            options={districts}
          />
        </View>
        <View className="flex-row gap-3">
          <ModalDropdown
            value={division}
            onChange={setDivision}
            placeholder="Division"
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
            options={divisions}
          />
          <ModalDropdown
            value={season?.id}
            onChange={(selectedSeasonId) => {
              const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);
              setSeason(selectedSeason);
            }}
            placeholder="Season"
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
            options={seasons}
          />
        </View>
      </View>

      <LeagueTable context={context} season={season} division={division} />
    </ScrollView>
  );
};

export default LeagueTableWrapper;

const styles = StyleSheet.create({});
