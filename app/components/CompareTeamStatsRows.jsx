import { Text, View } from 'react-native';
import StatCardCompare from '@components/StatCardCompare';

const CompareTeamStatsRows = ({ team1Stats, team2Stats, context }) => {
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
      homeValue: team1Stats.totalStats.matches_played || 0,
      homeValueH: team1Stats.totalStats.home_matches_played || 0,
      homeValueA: team1Stats.totalStats.away_matches_played || 0,
      awayValue: team2Stats.totalStats.matches_played || 0,
      awayValueH: team2Stats.totalStats.home_matches_played || 0,
      awayValueA: team2Stats.totalStats.away_matches_played || 0,
    },
    {
      statName: 'Matches Won',
      homeValue: team1Stats.totalStats.matches_won || 0,
      homeValueH: team1Stats.totalStats.home_matches_won || 0,
      homeValueA: team1Stats.totalStats.away_matches_won || 0,
      awayValue: team2Stats.totalStats.matches_won || 0,
      awayValueH: team2Stats.totalStats.home_matches_won || 0,
      awayValueA: team2Stats.totalStats.away_matches_won || 0,
    },
    {
      statName: 'Matches Drawn',
      homeValue: team1Stats.totalStats.matches_drawn || 0,
      homeValueH: team1Stats.totalStats.home_matches_drawn || 0,
      homeValueA: team1Stats.totalStats.away_matches_drawn || 0,
      awayValue: team2Stats.totalStats.matches_drawn || 0,
      awayValueH: team2Stats.totalStats.home_matches_drawn || 0,
      awayValueA: team2Stats.totalStats.away_matches_drawn || 0,
    },
    {
      statName: 'Matches Lost',
      homeValue: team1Stats.totalStats.matches_lost || 0,
      homeValueH: team1Stats.totalStats.home_matches_lost || 0,
      homeValueA: team1Stats.totalStats.away_matches_lost || 0,
      awayValue: team2Stats.totalStats.matches_lost || 0,
      awayValueH: team2Stats.totalStats.home_matches_lost || 0,
      awayValueA: team2Stats.totalStats.away_matches_lost || 0,
    },
    {
      statName: 'Match Win %',
      homeValue:
        team1Stats.totalStats.matches_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.matches_won / team1Stats.totalStats.matches_played) * 10000
            ) / 100,
      homeValueH:
        team1Stats.totalStats.home_matches_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.home_matches_won / team1Stats.totalStats.home_matches_played) *
                10000
            ) / 100,
      homeValueA:
        team1Stats.totalStats.away_matches_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.away_matches_won / team1Stats.totalStats.away_matches_played) *
                10000
            ) / 100,
      awayValue:
        team2Stats.totalStats.matches_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.matches_won / team2Stats.totalStats.matches_played) * 10000
            ) / 100,
      awayValueH:
        team2Stats.totalStats.home_matches_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.home_matches_won / team2Stats.totalStats.home_matches_played) *
                10000
            ) / 100,
      awayValueA:
        team2Stats.totalStats.away_matches_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.away_matches_won / team2Stats.totalStats.away_matches_played) *
                10000
            ) / 100,
      isPercentage: true,
    },
    {
      statName: 'Match Differential',
      homeValue: team1Stats.totalStats.matches_won - team1Stats.totalStats.matches_lost,
      homeValueH: team1Stats.totalStats.home_matches_won - team1Stats.totalStats.home_matches_lost,
      homeValueA: team1Stats.totalStats.away_matches_won - team1Stats.totalStats.away_matches_lost,
      awayValue: team2Stats.totalStats.matches_won - team2Stats.totalStats.matches_lost,
      awayValueH: team2Stats.totalStats.home_matches_won - team2Stats.totalStats.home_matches_lost,
      awayValueA: team2Stats.totalStats.away_matches_won - team2Stats.totalStats.away_matches_lost,
      differential: true,
    },
    {
      statName: 'Frames Played',
      homeValue: team1Stats.totalStats.frames_played || 0,
      homeValueH: team1Stats.totalStats.home_frames_played || 0,
      homeValueA: team1Stats.totalStats.away_frames_played || 0,
      awayValue: team2Stats.totalStats.frames_played || 0,
      awayValueH: team2Stats.totalStats.home_frames_played || 0,
      awayValueA: team2Stats.totalStats.away_frames_played || 0,
    },
    {
      statName: 'Frames Won',
      homeValue: team1Stats.totalStats.frames_won || 0,
      homeValueH: team1Stats.totalStats.home_frames_won || 0,
      homeValueA: team1Stats.totalStats.away_frames_won || 0,
      awayValue: team2Stats.totalStats.frames_won || 0,
      awayValueH: team2Stats.totalStats.home_frames_won || 0,
      awayValueA: team2Stats.totalStats.away_frames_won || 0,
    },
    {
      statName: 'Frames Lost',
      homeValue: team1Stats.totalStats.frames_lost || 0,
      homeValueH: team1Stats.totalStats.home_frames_lost || 0,
      homeValueA: team1Stats.totalStats.away_frames_lost || 0,
      awayValue: team2Stats.totalStats.frames_lost || 0,
      awayValueH: team2Stats.totalStats.home_frames_lost || 0,
      awayValueA: team2Stats.totalStats.away_frames_lost || 0,
    },
    {
      statName: 'Frame Win %',
      homeValue: team1Stats.totalStats.frame_win_percent,
      homeValueH: team1Stats.totalStats.home_frame_win_percent,
      homeValueA: team1Stats.totalStats.away_frame_win_percent,
      awayValue: team2Stats.totalStats.frame_win_percent,
      awayValueH: team2Stats.totalStats.home_frame_win_percent,
      awayValueA: team2Stats.totalStats.away_frame_win_percent,
      isPercentage: true,
    },
    {
      statName: 'Frames Won / Match',
      homeValue:
        Math.round(
          (team1Stats.totalStats.frames_won / (team1Stats.totalStats.matches_played || 1)) * 100
        ) / 100,
      homeValueH:
        Math.round(
          (team1Stats.totalStats.home_frames_won /
            (team1Stats.totalStats.home_matches_played || 1)) *
            100
        ) / 100,
      homeValueA:
        Math.round(
          (team1Stats.totalStats.away_frames_won /
            (team1Stats.totalStats.away_matches_played || 1)) *
            100
        ) / 100,
      awayValue:
        Math.round(
          (team2Stats.totalStats.frames_won / (team2Stats.totalStats.matches_played || 1)) * 100
        ) / 100,
      awayValueH:
        Math.round(
          (team2Stats.totalStats.home_frames_won /
            (team2Stats.totalStats.home_matches_played || 1)) *
            100
        ) / 100,
      awayValueA:
        Math.round(
          (team2Stats.totalStats.away_frames_won /
            (team2Stats.totalStats.away_matches_played || 1)) *
            100
        ) / 100,
    },
    {
      statName: 'Frame Differential',
      homeValue: team1Stats.totalStats.frames_won - team1Stats.totalStats.frames_lost,
      homeValueH: team1Stats.totalStats.home_frames_won - team1Stats.totalStats.home_frames_lost,
      homeValueA: team1Stats.totalStats.away_frames_won - team1Stats.totalStats.away_frames_lost,
      awayValue: team2Stats.totalStats.frames_won - team2Stats.totalStats.frames_lost,
      awayValueH: team2Stats.totalStats.home_frames_won - team2Stats.totalStats.home_frames_lost,
      awayValueA: team2Stats.totalStats.away_frames_won - team2Stats.totalStats.away_frames_lost,
      differential: true,
    },
  ];

  return (
    <View className="rounded-3xl bg-bg-grouped-2 py-3">
      {/* Stat rows */}
      {statRows.map((stat, index) => (
        <StatCardCompare
          key={index}
          homeTeam={team1Stats.teamMeta}
          awayTeam={team2Stats.teamMeta}
          stat={{
            statName: stat.statName,
            homeValue:
              context === 'all'
                ? stat.homeValue
                : context === 'home'
                  ? stat.homeValueH
                  : context === 'away'
                    ? stat.homeValueA
                    : stat.homeValue,
            awayValue:
              context === 'all'
                ? stat.awayValue
                : context === 'home'
                  ? stat.awayValueH
                  : context === 'away'
                    ? stat.awayValueA
                    : stat.awayValue,
            isPercentage: stat.isPercentage,
          }}
        />
      ))}
    </View>
  );
};

export default CompareTeamStatsRows;
