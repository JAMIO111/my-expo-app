import { Text, View } from 'react-native';
import StatCardCompare from '@components/StatCardCompare';

const CompareTeamStatsRows = ({ team1Stats, team2Stats }) => {
  if (!team1Stats || !team2Stats) return <Text>Loading...</Text>;
  if (!team1Stats || !team2Stats)
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
      statName: 'Matches Played',
      homeValue: team1Stats.totalStats.matches_played,
      awayValue: team2Stats.totalStats.matches_played,
    },
    {
      statName: 'Matches Won',
      homeValue: team1Stats.totalStats.matches_won,
      awayValue: team2Stats.totalStats.matches_won,
    },
    {
      statName: 'Matches Drawn',
      homeValue: team1Stats.totalStats.matches_drawn,
      awayValue: team2Stats.totalStats.matches_drawn,
    },
    {
      statName: 'Matches Lost',
      homeValue: team1Stats.totalStats.matches_lost,
      awayValue: team2Stats.totalStats.matches_lost,
    },
    {
      statName: 'Match Win %',
      homeValue:
        team1Stats.totalStats.matches_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.matches_won / team1Stats.totalStats.matches_played) * 10000
            ) / 100,
      awayValue:
        team2Stats.totalStats.matches_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.matches_won / team2Stats.totalStats.matches_played) * 10000
            ) / 100,
      isPercentage: true,
    },
    {
      statName: 'Match Differential',
      homeValue: team1Stats.totalStats.matches_won - team1Stats.totalStats.matches_lost,
      awayValue: team2Stats.totalStats.matches_won - team2Stats.totalStats.matches_lost,
      differential: true,
    },
    {
      statName: 'Frames Played',
      homeValue: team1Stats.totalStats.frames_played,
      awayValue: team2Stats.totalStats.frames_played,
    },
    {
      statName: 'Frames Won',
      homeValue: team1Stats.totalStats.frames_won,
      awayValue: team2Stats.totalStats.frames_won,
    },
    {
      statName: 'Frames Lost',
      homeValue: team1Stats.totalStats.frames_lost,
      awayValue: team2Stats.totalStats.frames_lost,
    },
    {
      statName: 'Frame Win %',
      homeValue:
        team1Stats.totalStats.frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.frames_won / team1Stats.totalStats.frames_played) * 10000
            ) / 100,
      awayValue:
        team2Stats.totalStats.frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.frames_won / team2Stats.totalStats.frames_played) * 10000
            ) / 100,

      isPercentage: true,
    },
    {
      statName: 'Avg Frames Won/Match',
      homeValue: team1Stats.totalStats.avg_frames_won_per_match,
      awayValue: team2Stats.totalStats.avg_frames_won_per_match,
    },
    {
      statName: 'Frame Differential',
      homeValue: team1Stats.totalStats.frames_won - team1Stats.totalStats.frames_lost,
      awayValue: team2Stats.totalStats.frames_won - team2Stats.totalStats.frames_lost,
      differential: true,
    },
  ];

  return (
    <View>
      {/* Stat rows */}
      {statRows.map((stat, index) => (
        <StatCardCompare
          key={index}
          homeTeam={team1Stats.teamMeta}
          awayTeam={team2Stats.teamMeta}
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

export default CompareTeamStatsRows;
