import { Text, View } from 'react-native';
import { useHeadToHeadStats } from '@hooks/useHeadToHeadStats';
import TeamLogo from '@components/TeamLogo';
import StatCardCompare from '@components/StatCardCompare';

const HeadToHead = ({ homeTeam, awayTeam, fixtureDetails }) => {
  const { data, isLoading } = useHeadToHeadStats(homeTeam?.id, awayTeam?.id);

  if (isLoading) return <Text>Loading...</Text>;
  if (!data || data.length < 2) return <Text>No head-to-head data available.</Text>;

  // Find home and away objects
  const homeStats = data.find((d) => d.team_id === homeTeam?.id);
  const awayStats = data.find((d) => d.team_id === awayTeam?.id);

  // Build an array of stat rows to loop through
  const statRows = [
    {
      statName: 'Matches Played',
      homeValue: homeStats.games_played,
      awayValue: awayStats.games_played,
    },
    { statName: 'Matches Won', homeValue: homeStats.games_won, awayValue: awayStats.games_won },
    {
      statName: 'Matches Drawn',
      homeValue: homeStats.games_drawn,
      awayValue: awayStats.games_drawn,
    },
    { statName: 'Matches Lost', homeValue: homeStats.games_lost, awayValue: awayStats.games_lost },
    {
      statName: 'Match Win %',
      homeValue: homeStats.game_win_percent,
      awayValue: awayStats.game_win_percent,
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
      homeValue: homeStats.frame_win_percent,
      awayValue: awayStats.frame_win_percent,
      isPercentage: true,
    },
  ];

  return (
    <View>
      {/* Header */}
      <View className="mb-1 flex-row justify-between bg-bg-grouped-2 p-3">
        <View className="flex-1 flex-row items-center justify-start gap-3">
          <TeamLogo size={36} {...homeTeam?.crest} />
          <Text className="mt-2 font-saira-semibold text-3xl text-text-1">
            {homeTeam?.abbreviation}
          </Text>
        </View>
        <Text className="px-2 pt-2 font-saira text-2xl text-text-2">vs</Text>
        <View className="flex-1 flex-row items-center justify-end gap-3">
          <Text className="mt-2 font-saira-semibold text-3xl text-text-1">
            {awayTeam?.abbreviation}
          </Text>
          <TeamLogo size={36} {...awayTeam?.crest} />
        </View>
      </View>

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

export default HeadToHead;
