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

  console.log('SeasonStats standings:', standings);

  const homeStats = standings?.standings?.find((s) => s.id === homeTeam?.id);
  const awayStats = standings?.standings?.find((s) => s.id === awayTeam?.id);

  const homeFramesPlayed = homeStats?.frames_for + homeStats?.frames_against;
  const awayFramesPlayed = awayStats?.frames_for + awayStats?.frames_against;

  console.log(homeStats, awayStats);

  if (isLoading)
    return (
      <View className="rounded-3xl bg-bg-grouped-2 p-8 shadow-sm">
        <Text className="w-full text-center font-saira text-lg text-text-2">Loading...</Text>
      </View>
    );
  if (!standings || standings.standings.length < 2)
    return (
      <View className="rounded-3xl bg-bg-grouped-2 p-8 shadow-sm">
        <Text className="w-full text-center font-saira text-lg text-text-2">
          No Seasons stats available.
        </Text>
      </View>
    );

  // Build an array of stat rows to loop through
  const statRows = [
    {
      statName: 'League Position',
      homeValue: homeStats?.position,
      awayValue: awayStats?.position,
    },
    { statName: 'Points', homeValue: homeStats?.points, awayValue: awayStats?.points },
    {
      statName: 'Matches Played',
      homeValue: homeStats?.played,
      awayValue: awayStats?.played,
    },
    { statName: 'Matches Won', homeValue: homeStats?.won, awayValue: awayStats?.won },
    {
      statName: 'Matches Drawn',
      homeValue: homeStats?.drawn,
      awayValue: awayStats?.drawn,
    },
    { statName: 'Matches Lost', homeValue: homeStats?.lost, awayValue: awayStats?.lost },
    {
      statName: 'Match Win %',
      homeValue:
        homeStats?.played < 1 ? 0 : Math.round((homeStats?.won / homeStats?.played) * 1000) / 10,
      awayValue:
        awayStats?.played < 1 ? 0 : Math.round((awayStats?.won / awayStats?.played) * 1000) / 10,
      isPercentage: true,
    },
    {
      statName: 'Frames Played',
      homeValue: homeFramesPlayed,
      awayValue: awayFramesPlayed,
    },
    { statName: 'Frames Won', homeValue: homeStats?.frames_for, awayValue: awayStats?.frames_for },
    {
      statName: 'Frames Lost',
      homeValue: homeStats?.frames_against,
      awayValue: awayStats?.frames_against,
    },
    {
      statName: 'Frame Win %',
      homeValue:
        homeFramesPlayed < 1
          ? 0
          : Math.round((homeStats?.frames_for / homeFramesPlayed) * 1000) / 10,
      awayValue:
        awayFramesPlayed < 1
          ? 0
          : Math.round((awayStats?.frames_for / awayFramesPlayed) * 1000) / 10,

      isPercentage: true,
    },
  ];

  return (
    <View className="rounded-3xl bg-bg-1 p-3 shadow-sm">
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
