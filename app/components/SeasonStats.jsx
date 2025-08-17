import { Text, View } from 'react-native';
import { useStandings } from '@hooks/useStandings';
import StatCardCompare from '@components/StatCardCompare';

const SeasonStats = ({ homeTeam, awayTeam, fixtureDetails }) => {
  const {
    data: standings,
    isLoading,
    error,
    isFetching,
  } = useStandings(fixtureDetails?.division, fixtureDetails?.season);

  const homeStats = standings?.standings?.find((s) => s.team === homeTeam?.id);
  const awayStats = standings?.standings?.find((s) => s.team === awayTeam?.id);

  if (isLoading) return <Text>Loading...</Text>;
  if (!standings || standings.length < 2)
    return (
      <View className="bg-bg-grouped-2 p-8">
        <Text className="w-full text-center font-saira text-lg text-text-2">
          No Seasons stats available.
        </Text>
      </View>
    );

  // Build an array of stat rows to loop through
  const statRows = [
    {
      statName: 'League Position',
      homeValue: homeStats.position,
      awayValue: awayStats.position,
    },
    { statName: 'Points', homeValue: homeStats.points, awayValue: awayStats.points },
    {
      statName: 'Matches Played',
      homeValue: homeStats.played,
      awayValue: awayStats.played,
    },
    { statName: 'Matches Won', homeValue: homeStats.won, awayValue: awayStats.won },
    {
      statName: 'Matches Drawn',
      homeValue: homeStats.drawn,
      awayValue: awayStats.drawn,
    },
    { statName: 'Matches Lost', homeValue: homeStats.lost, awayValue: awayStats.lost },
    {
      statName: 'Match Win %',
      homeValue:
        homeStats.played < 1 ? 0 : Math.round((homeStats.won / homeStats.played) * 10000) / 100,
      awayValue:
        awayStats.played < 1 ? 0 : Math.round((awayStats.won / awayStats.played) * 10000) / 100,
      isPercentage: true,
    },
    {
      statName: 'Frames Played',
      homeValue: homeStats.frames_played,
      awayValue: awayStats.frames_played,
    },
    { statName: 'Frames Won', homeValue: homeStats.frames_won, awayValue: awayStats.frames_won },
    { statName: 'Frames Lost', homeValue: homeStats.frames_lost, awayValue: awayStats.frames_lost },
    {
      statName: 'Frame Win %',
      homeValue:
        homeStats.frames_played < 1
          ? 0
          : Math.round((homeStats.frames_won / homeStats.frames_played) * 10000) / 100,
      awayValue:
        awayStats.frames_played < 1
          ? 0
          : Math.round((awayStats.frames_won / awayStats.frames_played) * 10000) / 100,

      isPercentage: true,
    },
  ];

  return (
    <View>
      {/* Stat rows */}
      {statRows.map((stat, index) => (
        <StatCardCompare
          key={index}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          stat={{
            statName: stat.statName,
            homeValue: stat.homeValue,
            awayValue: stat.awayValue,
            isPercentage: stat.isPercentage,
          }}
        />
      ))}
    </View>
  );
};

export default SeasonStats;
