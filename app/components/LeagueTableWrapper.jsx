import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import LeagueTable from '@components/LeagueTable';
import { getActiveSeason } from '@lib/helperFunctions';
import { useUser } from '@contexts/UserProvider';
import { useDistricts } from '@hooks/useDistricts';
import { useDivisions } from '@hooks/useDivisions';
import { useSeasons } from '@hooks/useSeasons';
import { useCompetitionInstances } from '@hooks/useCompetitionInstances';
import CTAButton from './CTAButton';
import BottomSheetWrapper from './BottomSheetWrapper';
import DropdownFilterButton from './DropdownFilterButton';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import BottomSheet, {
  BottomSheetFooter,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView } from 'react-native-gesture-handler';
import LoadingScreen from './LoadingScreen';

const LeagueTableWrapper = ({ context }) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined
  const { player, currentRole } = useUser();

  // Default full objects from context
  const defaultDistrict = currentRole?.district || null;
  const defaultDivision =
    currentRole?.type === 'admin'
      ? currentRole?.competitions?.filter((comp) => comp.division_tier === 1)?.[0]
      : currentRole?.division;
  const defaultSeason = currentRole?.activeSeason || null;
  const defaultCompetitionInstance =
    currentRole?.competitions
      .filter((comp) => comp.competition_type === 'league')
      .sort((a, b) => a.division_tier - b.division_tier)?.[0] || null;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(defaultDivision);
  const [season, setSeason] = useState(defaultSeason);
  const [tempDistrict, setTempDistrict] = useState(defaultDistrict);
  const [tempDivision, setTempDivision] = useState(defaultDivision);
  const [tempSeason, setTempSeason] = useState(defaultSeason);
  const [tempCompetitionInstance, setTempCompetitionInstance] = useState(
    defaultCompetitionInstance
  );
  const [competitionInstance, setCompetitionInstance] = useState(defaultCompetitionInstance);

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

  // Fetch seasons by district id
  const {
    data: seasons = [],
    isLoading: isSeasonsLoading,
    error: seasonsError,
  } = useSeasons(district?.id);

  const {
    data: competitionInstances = [],
    isLoading: isCompetitionInstancesLoading,
    error: competitionInstancesError,
  } = useCompetitionInstances(season?.id);

  // When district changes: reset division + season, fetch active season object
  useEffect(() => {
    if (!district) {
      setCompetitionInstance(null);
      setSeason(null);
      return;
    }

    const init = async () => {
      const active = await getActiveSeason(district?.id); // assume returns full season object
      setSeason(active);
      setTempSeason(active);
    };

    setCompetitionInstance(null);
    setTempCompetitionInstance(null);
    setTempSeason(null);
    setSeason(null);
    init();
  }, [district]);

  // When seasons load, set default season if none selected yet
  useEffect(() => {
    if (seasons.length && defaultSeason && !season) {
      const found = seasons.find((s) => s.id === defaultSeason.id);
      if (found) setSeason(found);
    }
  }, [seasons, defaultSeason, season]);

  // Loading or error fallback
  if (isDistrictsLoading || isSeasonsLoading || isCompetitionInstancesLoading) {
    return <LoadingScreen />;
  }

  if (districtsError || seasonsError || competitionInstancesError) {
    console.error('Error loading data:', districtsError, seasonsError, competitionInstancesError);
    return <Text>Error loading data</Text>;
  }

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
      case 'competition':
        setCompetitionInstance(tempCompetitionInstance);
        break;
    }
    closeSheet();
    setActiveFilter(null);
  };

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}
        className="w-full bg-brand-dark">
        <View className="h-fit w-full items-center justify-between gap-3 border-b border-brand bg-brand-dark p-3">
          <View className="flex-row gap-3">
            <DropdownFilterButton
              text={district?.name || 'Select District'}
              callbackFn={() => {
                setActiveFilter('district');
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
          <View className="flex-row gap-3">
            <DropdownFilterButton
              text={competitionInstance?.name || 'Select Competition'}
              callbackFn={() => {
                setActiveFilter('competition');
                openSheet();
              }}
            />
          </View>
        </View>

        {/* Pass IDs down to LeagueTable */}
        <LeagueTable
          context={context}
          season={season?.id}
          division={competitionInstance?.division_id}
        />
      </ScrollView>

      <BottomSheetWrapper
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['90%']}
        footerComponent={(props) => (
          <BottomSheetFooter {...props}>
            <View
              style={{ paddingBottom: 140 }}
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
          {activeFilter === 'competition' &&
            competitionInstances
              .filter((c) => c.status === 'active')
              .map((c) => (
                <Pressable
                  className="mb-3 flex-row items-center justify-between"
                  key={c.id}
                  onPress={() => setTempCompetitionInstance(c)}>
                  <Text
                    className={`font-saira text-2xl ${
                      tempCompetitionInstance?.id === c.id ? 'text-text-1' : 'text-text-2'
                    }`}>
                    {c.name}
                  </Text>
                  <Ionicons
                    size={24}
                    color={themeColors.primaryText}
                    name={tempCompetitionInstance?.id === c.id ? 'checkbox' : 'square-outline'}
                  />
                </Pressable>
              ))}
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </View>
  );
};

export default LeagueTableWrapper;

const styles = StyleSheet.create({});
