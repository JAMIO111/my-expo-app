import { Fragment } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TeamLogo from './TeamLogo';
import { useRouter } from 'expo-router';
import { useStandings } from '@hooks/useStandings';

const LeagueTable = ({ context, season, division }) => {
  const router = useRouter();

  const { data: standings, isLoading, error } = useStandings(division, season);
  const handlePress = (team) => {
    if (context === 'home') {
      router.push(`/home/league/${team.team}`);
    } else {
      //;
    }
  };

  console.log('Standings:', standings);

  if (!standings) {
    return (
      <View className="mt-4 w-full flex-1 items-center justify-center px-3">
        <View className="w-full gap-5 rounded-xl bg-bg-grouped-2 px-6 py-16">
          <Text className="w-full text-center text-lg text-text-1">
            No standings available yet for this season.
          </Text>
          <Text className="w-full text-center text-lg text-text-1">
            Try changing the filters to view another season or division.
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View className="w-full flex-1 items-center bg-bg-grouped-1 p-2">
      <Text className="mb-1 mt-2 w-full pl-2 text-left text-xl font-semibold text-text-2">
        {standings?.division?.name} Standings
      </Text>
      <View className="mb-16 w-full rounded-2xl border border-separator-faint bg-bg-grouped-2 p-3">
        <View className=" h-12 flex-row items-center justify-around border-b-[0.5px] border-separator">
          <Text className="w-10 text-center font-bold text-text-2">Pos</Text>
          <Text className="flex-1 pl-3 text-left font-bold text-text-2">Team</Text>
          <Text className="w-8 text-center font-bold text-text-2">PL</Text>
          <Text className="w-8 text-center font-bold text-text-2">W</Text>
          <Text className="w-8 text-center font-bold text-text-2">L</Text>
          <Text className="w-9 text-center font-bold text-text-2">Pts</Text>
          <Text className="w-8 text-center font-bold text-text-2">CC</Text>
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
            <View className=" flex-row items-center justify-around py-3">
              <Text className="w-10 text-center text-lg text-text-1">{team.position}</Text>
              <Pressable
                onPress={() => handlePress(team)}
                className="flex-1 flex-row items-center gap-3 pl-3">
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
                  className="flex-1 text-left font-semibold text-text-1">
                  {team.Teams.display_name}
                </Text>
              </Pressable>
              <Text className="w-8 text-center text-lg text-text-1">{team.played}</Text>
              <Text className="w-8 text-center text-lg text-text-1">{team.won}</Text>
              <Text className="w-8 text-center text-lg text-text-1">{team.lost}</Text>
              <Text className="w-9 text-center text-lg font-semibold text-text-1">
                {team.points}
              </Text>
              <Text className="w-8 text-center text-lg font-semibold text-theme-orange">
                {team.CaptainCup || '-'}
              </Text>
            </View>
            {standings?.division?.promotion_spots !== 0 &&
              index === standings?.division?.promotion_spots && (
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
