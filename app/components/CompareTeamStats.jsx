import { useRef, useState } from 'react';
import {
  View,
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

export default function CompareTeamStats() {
  const { currentRole } = useUser();
  const { defaultTeam } = useLocalSearchParams();
  const [changingTeam, setChangingTeam] = useState(null);
  const [team1, setTeam1] = useState(defaultTeam ? JSON.parse(defaultTeam) : null);
  const [team2, setTeam2] = useState(null);
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
  const defaultSeason = currentRole?.activeSeason ?? null;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(defaultDivision);

  const { data: teams } = useTeamsByDivision(division?.id);
  console.log('Teams in division:', teams);

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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Scroll Content first */}
        <Animated.ScrollView
          className="bg-brand-dark"
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: 40 }}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}>
          {Array.from({ length: 30 }).map((_, i) => (
            <Pressable
              onPress={() => console.log(`Card ${i + 1} pressed`)}
              key={i}
              style={styles.card}>
              <Text>Card {i + 1}</Text>
            </Pressable>
          ))}
        </Animated.ScrollView>

        {/* Large Header ABOVE ScrollView */}
        <Animated.View
          className="bg-brand-light"
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
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-brand p-5 shadow-md"
              onPress={() => openSheet('team1')}>
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
                {team1?.display_name || ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-brand p-5 shadow-sm"
              onPress={() => openSheet('team2')}>
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
                {team2?.display_name || ''}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Small Header on top */}
        <Animated.View
          className="flex flex-row items-center justify-between bg-brand-light px-4 py-2"
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
      </SafeAreaView>

      {/* Bottom Sheet */}
      <BottomSheetWrapper ref={bottomSheetRef} initialIndex={-1} snapPoints={['90%']}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 10, paddingBottom: 100 }}>
          <Text style={{ fontSize: 24 }}>
            {defaultDistrict.name} {defaultDivision.name}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
            {teams?.map((team, index) => (
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
    zIndex: 30,
  },
  largeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
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
