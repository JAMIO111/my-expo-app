import { useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  Animated,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import TeamLogo from '@components/TeamLogo';
import { useUser } from '@contexts/UserProvider';
import { useTeamsByDivision } from '@hooks/useTeamsByDivision';
import { useLocalSearchParams } from 'expo-router';
import { useTeamStats } from '@hooks/useTeamStats';
import AnimatedSearchBar from './AnimatedSearchBar';
import CompareTeamStatsRows from './CompareTeamStatsRows';

export default function CompareTeamStats() {
  const { currentRole } = useUser();
  const { defaultTeam } = useLocalSearchParams();
  const [changingTeam, setChangingTeam] = useState(null);
  const [team1, setTeam1] = useState(defaultTeam ? JSON.parse(defaultTeam) : null);
  const [team2, setTeam2] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const bottomSheetRef = useRef(null);
  const { data: team1Stats, isLoading: isTeamStats1Loading } = useTeamStats(team1?.id);
  const { data: team2Stats, isLoading: isTeamStats2Loading } = useTeamStats(team2?.id);

  console.log('Team 1 Stats:', team1Stats);
  console.log('Team 2 Stats:', team2Stats);

  const defaultDistrict =
    currentRole?.role === 'admin'
      ? currentRole?.district
      : (currentRole?.team?.division?.district ?? null);
  const defaultDivision =
    currentRole?.role === 'admin' ? currentRole?.divisions[0] : currentRole?.team?.division;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(defaultDivision);

  const { data: teams } = useTeamsByDivision(division?.id);

  const HEADER_HEIGHT = 200;
  const maxScroll = 150;

  const largeHeaderTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const largeHeaderOpacity = scrollY.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const smallHeaderOpacity = scrollY.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const openSheet = (team) => {
    setChangingTeam(team);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {team1Stats && team2Stats ? (
          <Animated.ScrollView
            className="bg-brand-dark p-3"
            contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: 40 }}
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}>
            <View className="overflow-hidden rounded-2xl">
              <CompareTeamStatsRows team1Stats={team1Stats} team2Stats={team2Stats} />
            </View>
          </Animated.ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center bg-brand-dark pt-24">
            <Image source={require('@assets/pool_table.png')} className="mb-4 h-40 w-64" />
            <Text className="text-center font-saira text-xl text-text-on-brand">
              Please select two teams{'\n'}
              to compare their stats.
            </Text>
          </View>
        )}

        {/* Large Header ABOVE ScrollView */}
        <Animated.View
          className="bg-brand"
          style={[
            styles.largeHeader,
            {
              height: HEADER_HEIGHT,
              opacity: largeHeaderOpacity,
              transform: [{ translateY: largeHeaderTranslate }],
            },
          ]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              className="relative flex flex-1 items-center justify-center gap-3 rounded-2xl bg-brand-light p-5 shadow-md"
              onPress={() => openSheet('team1')}>
              <View className="absolute right-2 top-2">
                {team1 ? (
                  <Ionicons name="sync" size={24} color="#fff" />
                ) : (
                  <Ionicons name="add" size={28} color="#fff" />
                )}
              </View>
              {team1 ? (
                <TeamLogo
                  type={team1.crest.type}
                  color1={team1.crest.color1}
                  color2={team1.crest.color2}
                  thickness={team1.crest.thickness}
                  size={80}
                />
              ) : (
                <Ionicons name="shield" size={80} color="#fff" />
              )}
              <Text className="text-center font-saira-medium text-xl text-text-on-brand">
                {team1?.display_name || 'Select a team'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-brand-light p-5 shadow-md"
              onPress={() => openSheet('team2')}>
              <View className="absolute right-2 top-2">
                {team2 ? (
                  <Ionicons name="sync" size={24} color="#fff" />
                ) : (
                  <Ionicons name="add" size={28} color="#fff" />
                )}
              </View>
              {team2 ? (
                <TeamLogo
                  type={team2.crest.type}
                  color1={team2.crest.color1}
                  color2={team2.crest.color2}
                  thickness={team2.crest.thickness}
                  size={80}
                />
              ) : (
                <Ionicons name="shield" size={80} color="#fff" />
              )}
              <Text className="text-center font-saira-medium text-xl text-text-on-brand">
                {team2?.display_name || 'Select a team'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Small Header on top */}
        <Animated.View
          className="flex flex-row items-center justify-between bg-brand px-4 py-2"
          pointerEvents="none"
          style={[styles.smallHeader, { opacity: smallHeaderOpacity }]}>
          <View className="flex flex-1 flex-row items-center justify-start gap-3">
            {team1 ? (
              <TeamLogo
                type={team1.crest.type}
                color1={team1.crest.color1}
                color2={team1.crest.color2}
                thickness={team1.crest.thickness}
                size={38}
              />
            ) : (
              <Ionicons name="shield" size={38} color="#fff" />
            )}

            <View className="flex items-start justify-center">
              <Text className="text-md font-saira-medium text-text-on-brand">
                {team1?.display_name || 'Select Team'}
              </Text>
              <Text className="text-sm text-text-on-brand-2">Division 1</Text>
            </View>
          </View>
          <View className="flex flex-1 flex-row items-center justify-end gap-3">
            <View className="flex items-end justify-center">
              <Text className="text-md font-saira-medium text-text-on-brand">
                {team2?.display_name || 'Select Team'}
              </Text>
              <Text className="text-sm text-text-on-brand-2">Division 1</Text>
            </View>
            {team2 ? (
              <TeamLogo
                type={team2.crest.type}
                color1={team2.crest.color1}
                color2={team2.crest.color2}
                thickness={team2.crest.thickness}
                size={38}
              />
            ) : (
              <Ionicons name="shield" size={38} color="#fff" />
            )}
          </View>
        </Animated.View>
      </View>

      {/* Bottom Sheet */}
      <BottomSheetWrapper ref={bottomSheetRef} initialIndex={-1} snapPoints={['90%']}>
        <AnimatedSearchBar
          cancelColor="text-text-2"
          backColor="bg-bg-1"
          searchBarColor="bg-bg-2"
          searchActive={searchActive}
          setSearchActive={setSearchActive}
          onDebouncedChange={setSearchQuery}
        />

        <BottomSheetScrollView contentContainerStyle={{ padding: 10, paddingBottom: 100 }}>
          <Text style={{ fontSize: 24 }}>
            {defaultDistrict.name} {defaultDivision.name}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
            {teams
              ?.filter(
                (team) =>
                  team.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  team.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              ?.map((team, index) => (
                <Pressable
                  className={`relative rounded-xl bg-bg-2 py-6 ${changingTeam === 'team1' && team.id === team1?.id ? 'border-2 border-brand' : ''} ${changingTeam === 'team2' && team.id === team2?.id ? 'border-2 border-brand' : ''}`}
                  key={team.id}
                  style={{
                    gap: 2,
                    width: '32%', // roughly 3 columns
                    marginRight: (index + 1) % 3 === 0 ? 0 : '2%', // add margin except for last item in row
                    marginBottom: 6,
                    paddingHorizontal: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (changingTeam === 'team1') {
                      setTeam1(team);
                    } else {
                      setTeam2(team);
                    }
                    closeSheet();
                  }}>
                  {/* Logo stays at the top */}
                  <TeamLogo
                    type={team.crest.type}
                    color1={team.crest.color1}
                    color2={team.crest.color2}
                    thickness={team.crest.thickness}
                    size={44}
                  />

                  <View
                    style={{
                      flex: 1, // take remaining space
                      justifyContent: 'center', // vertical center if text doesn't wrap
                      marginTop: 4,
                      width: '100%',
                    }}>
                    <Text
                      className="text-text-1"
                      style={{
                        fontFamily: 'Saira-Medium',
                        textAlign: 'center',
                        flexWrap: 'wrap',
                      }}
                      numberOfLines={2} // optional max 2 lines
                      ellipsizeMode="tail">
                      {team.display_name}
                    </Text>
                  </View>
                  {(changingTeam === 'team1' && team.id === team1?.id) ||
                  (changingTeam === 'team2' && team.id === team2?.id) ? (
                    <View
                      style={{
                        borderTopRightRadius: 6,
                        borderBottomLeftRadius: 4,
                      }}
                      className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-brand">
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              ))}
          </View>
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  smallHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  largeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  card: {
    height: 96,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
