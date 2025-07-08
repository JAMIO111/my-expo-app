import { Fragment } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TeamLogo from './TeamLogo';
import { useRouter } from 'expo-router';
import { useStandings } from '@hooks/useStandings';

const LeagueTable = ({ context, season, division }) => {
  const router = useRouter();

  const { data: standings, isLoading, error } = useStandings(division, season?.id);

  const handlePress = () => {
    if (context === 'home') {
      router.push(`/home/league/217ac485-01c2-4ffe-a42b-9ec602be017c`);
    } else {
      //;
    }
  };

  console.log('Standings:', standings);
  return (
    <View className="w-full flex-1 items-center bg-bg-grouped-1 p-2">
      <View className="border-separator-faint mb-16 w-full rounded-2xl border bg-bg-grouped-2 p-3">
        <View className=" h-12 flex-row items-center justify-around border-b border-separator">
          <Text className="w-10 text-center font-bold text-brand-light">Pos</Text>
          <Text className="flex-1 pl-3 text-left font-bold text-brand-light">Team</Text>
          <Text className="w-8 text-center font-bold text-brand-light">PL</Text>
          <Text className="w-8 text-center font-bold text-brand-light">W</Text>
          <Text className="w-8 text-center font-bold text-brand-light">L</Text>
          <Text className="w-9 text-center font-bold text-brand-light">Pts</Text>
          <Text className="w-8 text-center font-bold text-brand-light">CC</Text>
        </View>
        {standings?.map((team, index) => (
          <Fragment key={index}>
            {index === standings?.length - 3 && (
              <LinearGradient
                colors={['#8b5cf6', '#dc2626', '#dc2626']} // from-purple-500 to-red-600
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 2, width: '100%' }}
              />
            )}
            <View className=" flex-row items-center justify-around py-3">
              <Text className="w-10 text-center text-lg text-text-1">{team.position}</Text>
              <Pressable onPress={handlePress} className="flex-1 flex-row items-center gap-3 pl-3">
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
              <Text className="w-8 text-center text-lg font-semibold text-orange-500">
                {team.CaptainCup}
              </Text>
            </View>
            {index === 2 && (
              <LinearGradient
                colors={['#00ffee', '#7c3aed', '#7c3aed']} // from-purple-500 to-purple-600
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 2, width: '100%' }}
              />
            )}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

export default LeagueTable;
