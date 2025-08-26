import { Fragment, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TeamLogo from './TeamLogo';
import { useRouter } from 'expo-router';
import { useStandings } from '@hooks/useStandings';
import { TableSkeleton } from '@components/Skeletons';

const LeagueTable = ({ context, season, division }) => {
  const router = useRouter();
  const hasNavigated = useRef(false);

  const { data: standings, isLoading, error, isFetching } = useStandings(division, season);
  console.log('LeagueTable standings:', standings);

  const handlePress = (team) => {
    if (!context) return;
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setTimeout(() => {
      hasNavigated.current = false;
    }, 750);
    if (context === 'home/league') {
      router.push(`/home/league/${team.team}`);
    } else {
      //;
    }
  };

  const hasNoStandings = !(standings && standings.standings && standings.standings.length > 0);

  // Show skeleton only on first load
  if (isLoading) {
    return <TableSkeleton />;
  }
  // Show no data message if loaded and no standings available
  if (!isLoading && !isFetching && hasNoStandings) {
    return (
      <View className="mt-4 w-full flex-1 items-center justify-center px-3">
        <View className="w-full gap-5 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 px-10 py-16">
          <Text className="w-full text-center font-saira-medium text-lg text-text-1">
            No standings available yet for this season.
          </Text>
          <Text className="w-full text-center font-saira text-lg text-text-1">
            Try changing the filters to view another season or division.
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View className="w-full flex-1 items-center bg-bg-grouped-1 p-3">
      <Text className="mb-1 mt-2 w-full pl-2 text-left font-saira-medium text-xl text-text-2">
        {standings?.division?.name} Standings
      </Text>
      <View className="mb-16 w-full rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-3">
        <View className="h-8 flex-row items-center justify-around border-b-[0.5px] border-separator">
          <Text className="w-18 text-center font-saira font-bold text-text-2">Pos</Text>
          <Text className="flex-1 pl-3 text-left font-saira font-bold text-text-2">Team</Text>
          <Text className="w-8 text-center font-saira font-bold text-text-2">PL</Text>
          <Text className="w-8 text-center font-saira font-bold text-text-2">W</Text>
          {standings?.division?.draws_allowed && (
            <Text className="w-8 text-center font-saira font-bold text-text-2">D</Text>
          )}
          <Text className="w-8 text-center font-saira font-bold text-text-2">L</Text>
          <Text className="w-9 text-center font-saira font-bold text-text-2">Pts</Text>
          {standings?.division?.special_match && (
            <Text className="w-8 text-center font-saira font-bold text-text-2">CC</Text>
          )}
        </View>
        {standings.standings?.map((team, index) => (
          <Fragment key={index}>
            {standings?.division?.relegation_spots !== 0 &&
              index === standings?.standings.length - standings?.division?.relegation_spots && (
                <LinearGradient
                  colors={['#8b5cf6', '#dc2626', '#dc2626']} // from-purple-500 to-red-600
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 1.5, width: '100%' }}
                />
              )}
            <View className="flex-row items-center justify-around">
              <Text className="w-8 text-center font-saira text-lg text-text-1">
                {team.position}.
              </Text>
              <Pressable
                onPress={() => handlePress(team)}
                className="flex-1 flex-row items-center gap-3 py-3 pl-3">
                <TeamLogo
                  type={team?.Teams?.crest?.type}
                  color1={team?.Teams?.crest?.color1}
                  color2={team?.Teams?.crest?.color2}
                  thickness={team?.Teams?.crest?.thickness}
                  size={20}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="flex-1 text-left font-saira-medium text-lg text-text-1">
                  {team.Teams.display_name}
                </Text>
              </Pressable>
              <Text className="w-8 text-center font-saira text-lg text-text-1">{team.played}</Text>
              <Text className="w-8 text-center font-saira text-lg text-text-1">{team.won}</Text>
              {standings?.division?.draws_allowed && (
                <Text className="w-8 text-center font-saira text-lg text-text-1">{team.drawn}</Text>
              )}
              <Text className="w-8 text-center font-saira text-lg text-text-1">{team.lost}</Text>
              <Text className="w-9 text-center font-saira-semibold text-lg text-text-1">
                {team.points}
              </Text>
              {standings?.division?.special_match && (
                <Text className="w-8 text-center font-saira text-lg font-semibold text-theme-orange">
                  {team.special_match ?? '-'}
                </Text>
              )}
            </View>
            {standings?.division?.promotion_spots !== 0 &&
              index === standings?.division?.promotion_spots - 1 && (
                <LinearGradient
                  colors={['#00ffee', '#7c3aed', '#7c3aed']} // from-purple-500 to-purple-600
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 1.5, width: '100%' }}
                />
              )}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

export default LeagueTable;
