import { useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  Animated,
  StyleSheet,
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
import { usePlayersByDistrict } from '@hooks/usePlayersByDistrict';
import { useLocalSearchParams } from 'expo-router';
import { useTeamStats } from '@hooks/useTeamStats';
import { usePlayerStats } from '@hooks/usePlayerStats';
import AnimatedSearchBar from './AnimatedSearchBar';
import CompareTeamStatsRows from './CompareTeamStatsRows';
import Avatar from './Avatar';
import MultiOptionSlidingToggle from './MultiOptionSlidingToggle';

export default function CompareTeamStats() {
  const { currentRole } = useUser();
  const { defaultEntity, entityType } = useLocalSearchParams();
  const [changingEntity, setChangingEntity] = useState(null);
  const [entity1, setEntity1] = useState(defaultEntity ? JSON.parse(defaultEntity) : null);
  const [entity2, setEntity2] = useState(null);
  const [view, setView] = useState('all');
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const bottomSheetRef = useRef(null);
  const teamStats1 = useTeamStats(entityType === 'team' ? entity1?.id : null);
  const teamStats2 = useTeamStats(entityType === 'team' ? entity2?.id : null);
  const playerStats1 = usePlayerStats(entityType === 'player' ? entity1?.id : null);
  const playerStats2 = usePlayerStats(entityType === 'player' ? entity2?.id : null);

  const stats1 = entityType === 'team' ? teamStats1.data : playerStats1.data;
  const stats2 = entityType === 'team' ? teamStats2.data : playerStats2.data;

  console.log('Entity 1:', entity1);
  console.log('Entity 2:', entity2);
  console.log('Entity 1 Stats:', stats1);
  console.log('Entity 2 Stats:', stats2);

  const defaultDistrict = currentRole?.district;
  const defaultDivision =
    currentRole?.role === 'admin' ? currentRole?.divisions[0] : currentRole?.division;

  const [district, setDistrict] = useState(defaultDistrict);
  const [division, setDivision] = useState(defaultDivision);

  const { data: teams } = useTeamsByDivision(entityType === 'team' ? division?.id : null);
  const { data: players } = usePlayersByDistrict(entityType === 'player' ? district?.id : null);

  console.log('Teams in Division:', teams);
  console.log('Players in District:', players);

  const entities = entityType === 'team' ? teams : players;

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

  const openSheet = (entity) => {
    setChangingEntity(entity);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {stats1 && stats2 ? (
          <Animated.ScrollView
            className="bg-brand-dark p-3"
            contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: 40 }}
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}>
            <View className="flex gap-3 overflow-hidden">
              <MultiOptionSlidingToggle
                value={view}
                onChange={setView}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Home', value: 'home' },
                  { label: 'Away', value: 'away' },
                ]}
              />
              <View className="overflow-hidden rounded-2xl">
                <CompareTeamStatsRows team1Stats={stats1} team2Stats={stats2} context={view} />
              </View>
            </View>
          </Animated.ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center bg-brand-dark pt-24">
            <Image source={require('@assets/pool_table.png')} className="mb-4 h-40 w-64" />
            <Text className="text-center font-saira text-xl text-text-on-brand">
              Please select two {entityType === 'team' ? 'teams' : 'players'}
              {'\n'}
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
              onPress={() => openSheet('entity1')}>
              <View className="absolute right-2 top-2">
                {entity1 ? (
                  <Ionicons name="sync" size={24} color="#fff" />
                ) : (
                  <Ionicons name="add" size={28} color="#fff" />
                )}
              </View>
              {entity1 ? (
                entityType === 'team' ? (
                  <TeamLogo
                    type={entity1.crest.type}
                    color1={entity1.crest.color1}
                    color2={entity1.crest.color2}
                    thickness={entity1.crest.thickness}
                    size={80}
                  />
                ) : (
                  <Avatar player={entity1} size={80} borderRadius={40} backgroundColor="bg-brand" />
                )
              ) : (
                <Ionicons
                  name={entityType === 'team' ? 'shield' : 'person-circle-outline'}
                  size={80}
                  color="#fff"
                />
              )}
              <Text className="text-center font-saira-medium text-xl text-text-on-brand">
                {entity1
                  ? entityType === 'team'
                    ? entity1?.display_name
                    : `${entity1?.first_name} ${entity1?.surname}`
                  : `Select a ${entityType}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-brand-light p-5 shadow-md"
              onPress={() => openSheet('entity2')}>
              <View className="absolute right-2 top-2">
                {entity2 ? (
                  <Ionicons name="sync" size={24} color="#fff" />
                ) : (
                  <Ionicons name="add" size={28} color="#fff" />
                )}
              </View>
              {entity2 ? (
                entityType === 'team' ? (
                  <TeamLogo
                    type={entity2.crest.type}
                    color1={entity2.crest.color1}
                    color2={entity2.crest.color2}
                    thickness={entity2.crest.thickness}
                    size={80}
                  />
                ) : (
                  <Avatar player={entity2} size={80} borderRadius={40} backgroundColor="bg-brand" />
                )
              ) : (
                <Ionicons
                  name={entityType === 'team' ? 'shield' : 'person-circle-outline'}
                  size={80}
                  color="#fff"
                />
              )}
              <Text className="text-center font-saira-medium text-xl text-text-on-brand">
                {entity2
                  ? entityType === 'team'
                    ? entity2?.display_name
                    : `${entity2?.first_name} ${entity2?.surname}`
                  : `Select a ${entityType}`}
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
            {entity1 ? (
              entityType === 'team' ? (
                <TeamLogo
                  type={entity1.crest.type}
                  color1={entity1.crest.color1}
                  color2={entity1.crest.color2}
                  thickness={entity1.crest.thickness}
                  size={38}
                />
              ) : (
                <Avatar player={entity1} size={38} borderRadius={19} />
              )
            ) : (
              <Ionicons
                name={entityType === 'team' ? 'shield' : 'person-circle-outline'}
                size={38}
                color="#fff"
              />
            )}

            <View className="flex items-start justify-center">
              <Text className="text-md font-saira-medium text-text-on-brand">
                {entity1
                  ? entityType === 'team'
                    ? entity1?.display_name
                    : `${entity1?.first_name} ${entity1?.surname}`
                  : `Select a ${entityType}`}
              </Text>
              <Text className="text-sm text-text-on-brand-2">Division 1</Text>
            </View>
          </View>
          <View className="flex flex-1 flex-row items-center justify-end gap-3">
            <View className="flex items-end justify-center">
              <Text className="text-md font-saira-medium text-text-on-brand">
                {entity2
                  ? entityType === 'team'
                    ? entity2?.display_name
                    : `${entity2?.first_name} ${entity2?.surname}`
                  : `Select a ${entityType}`}
              </Text>
              <Text className="text-sm text-text-on-brand-2">Division 1</Text>
            </View>
            {entity2 ? (
              entityType === 'team' ? (
                <TeamLogo
                  type={entity2.crest.type}
                  color1={entity2.crest.color1}
                  color2={entity2.crest.color2}
                  thickness={entity2.crest.thickness}
                  size={38}
                />
              ) : (
                <Avatar player={entity2} size={38} borderRadius={19} />
              )
            ) : (
              <Ionicons
                name={entityType === 'team' ? 'shield' : 'person-circle-outline'}
                size={38}
                color="#fff"
              />
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
          placeholder={`Search for ${entityType === 'team' ? 'teams' : 'players'}...`}
        />
        <Text style={{ fontSize: 24, paddingBottom: 6, paddingLeft: 12 }}>
          {defaultDistrict.name} {entityType === 'team' ? 'Teams' : 'Players'}
        </Text>
        <BottomSheetScrollView contentContainerStyle={{ padding: 10, paddingBottom: 140 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 0 }}>
            {entities
              ?.filter((entity) =>
                entityType === 'team'
                  ? entity.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    entity.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  : entity.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    entity.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    entity.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              ?.map((entity, index) => (
                <Pressable
                  className={`relative rounded-xl bg-bg-2 py-4 ${changingEntity === 'entity1' && entity.id === entity1?.id ? 'border-2 border-brand' : ''} ${changingEntity === 'entity2' && entity.id === entity2?.id ? 'border-2 border-brand' : ''}`}
                  key={entity.id}
                  style={{
                    gap: 2,
                    width: '32%', // roughly 3 columns
                    marginRight: (index + 1) % 3 === 0 ? 0 : '2%', // add margin except for last item in row
                    marginBottom: 6,
                    paddingHorizontal: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (changingEntity === 'entity1') {
                      setEntity1(entity);
                    } else {
                      setEntity2(entity);
                    }
                    closeSheet();
                  }}>
                  {/* Logo stays at the top */}
                  {entityType === 'team' ? (
                    <TeamLogo
                      type={entity.crest.type}
                      color1={entity.crest.color1}
                      color2={entity.crest.color2}
                      thickness={entity.crest.thickness}
                      size={44}
                    />
                  ) : (
                    <Avatar player={entity} size={60} borderRadius={30} />
                  )}

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
                      {entityType === 'team'
                        ? entity.display_name
                        : `${entity.first_name} ${entity.surname}`}
                    </Text>
                  </View>
                  {(changingEntity === 'entity1' && entity.id === entity1?.id) ||
                  (changingEntity === 'entity2' && entity.id === entity2?.id) ? (
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
