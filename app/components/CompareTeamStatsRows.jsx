import { Text, View } from 'react-native';
import StatCardCompare from '@components/StatCardCompare';
import Heading from '@components/Heading';

const CompareTeamStatsRows = ({ team1Stats, team2Stats, context }) => {
  if (!team1Stats || !team2Stats)
    return (
      <View className="p-8">
        <Text className="w-full text-center font-saira text-lg text-text-on-brand">
          No stats available.
        </Text>
      </View>
    );

  const homeStat =
    context === 'home' ? 'homeValueH' : context === 'away' ? 'homeValueA' : 'homeValue';
  const awayStat =
    context === 'home' ? 'awayValueH' : context === 'away' ? 'awayValueA' : 'awayValue';

  const framesRows = [
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
      homeValue:
        team1Stats.totalStats.frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.frames_won / team1Stats.totalStats.frames_played) * 10000
            ) / 100,
      homeValueH:
        team1Stats.totalStats.home_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.home_frames_won / team1Stats.totalStats.home_frames_played) *
                10000
            ) / 100,
      homeValueA:
        team1Stats.totalStats.away_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.away_frames_won / team1Stats.totalStats.away_frames_played) *
                10000
            ) / 100,
      awayValue:
        team2Stats.totalStats.frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.frames_won / team2Stats.totalStats.frames_played) * 10000
            ) / 100,
      awayValueH:
        team2Stats.totalStats.home_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.home_frames_won / team2Stats.totalStats.home_frames_played) *
                10000
            ) / 100,
      awayValueA:
        team2Stats.totalStats.away_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.away_frames_won / team2Stats.totalStats.away_frames_played) *
                10000
            ) / 100,
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

  const matchRows = [
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
  ];

  const FrameFormatRows = [
    {
      statName: 'Bonus Frames Played',
      homeValue: team1Stats.totalStats.bonus_frames_played || 0,
      awayValue: team2Stats.totalStats.bonus_frames_played || 0,
      homeValueH: team1Stats.totalStats.home_bonus_frames_played || 0,
      homeValueA: team1Stats.totalStats.away_bonus_frames_played || 0,
      awayValueH: team2Stats.totalStats.home_bonus_frames_played || 0,
      awayValueA: team2Stats.totalStats.away_bonus_frames_played || 0,
    },
    {
      statName: 'Bonus Frames Won',
      homeValue: team1Stats.totalStats.bonus_frames_won || 0,
      awayValue: team2Stats.totalStats.bonus_frames_won || 0,
      homeValueH: team1Stats.totalStats.home_bonus_frames_won || 0,
      homeValueA: team1Stats.totalStats.away_bonus_frames_won || 0,
      awayValueH: team2Stats.totalStats.home_bonus_frames_won || 0,
      awayValueA: team2Stats.totalStats.away_bonus_frames_won || 0,
    },
    {
      statName: 'Bonus Frames Lost',
      homeValue: team1Stats.totalStats.bonus_frames_lost || 0,
      awayValue: team2Stats.totalStats.bonus_frames_lost || 0,
      homeValueH: team1Stats.totalStats.home_bonus_frames_lost || 0,
      homeValueA: team1Stats.totalStats.away_bonus_frames_lost || 0,
      awayValueH: team2Stats.totalStats.home_bonus_frames_lost || 0,
      awayValueA: team2Stats.totalStats.away_bonus_frames_lost || 0,
    },
    {
      statName: 'Bonus Frame Win %',
      homeValue:
        team1Stats.totalStats.bonus_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.bonus_frames_won / team1Stats.totalStats.bonus_frames_played) *
                10000
            ) / 100,
      awayValue:
        team2Stats.totalStats.bonus_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.bonus_frames_won / team2Stats.totalStats.bonus_frames_played) *
                10000
            ) / 100,
      homeValueH:
        team1Stats.totalStats.home_bonus_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.home_bonus_frames_won /
                team1Stats.totalStats.home_bonus_frames_played) *
                10000
            ) / 100,
      homeValueA:
        team1Stats.totalStats.away_bonus_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.away_bonus_frames_won /
                team1Stats.totalStats.away_bonus_frames_played) *
                10000
            ) / 100,
      awayValueH:
        team2Stats.totalStats.home_bonus_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.home_bonus_frames_won /
                team2Stats.totalStats.home_bonus_frames_played) *
                10000
            ) / 100,
      awayValueA:
        team2Stats.totalStats.away_bonus_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.away_bonus_frames_won /
                team2Stats.totalStats.away_bonus_frames_played) *
                10000
            ) / 100,
      isPercentage: true,
    },
    {
      statName: 'Doubles Frames Played',
      homeValue: team1Stats.totalStats.doubles_frames_played || 0,
      awayValue: team2Stats.totalStats.doubles_frames_played || 0,
      homeValueH: team1Stats.totalStats.home_doubles_frames_played || 0,
      homeValueA: team1Stats.totalStats.away_doubles_frames_played || 0,
      awayValueH: team2Stats.totalStats.home_doubles_frames_played || 0,
      awayValueA: team2Stats.totalStats.away_doubles_frames_played || 0,
    },
    {
      statName: 'Doubles Frames Won',
      homeValue: team1Stats.totalStats.doubles_frames_won || 0,
      awayValue: team2Stats.totalStats.doubles_frames_won || 0,
      homeValueH: team1Stats.totalStats.home_doubles_frames_won || 0,
      homeValueA: team1Stats.totalStats.away_doubles_frames_won || 0,
      awayValueH: team2Stats.totalStats.home_doubles_frames_won || 0,
      awayValueA: team2Stats.totalStats.away_doubles_frames_won || 0,
    },
    {
      statName: 'Doubles Frames Lost',
      homeValue: team1Stats.totalStats.doubles_frames_lost || 0,
      awayValue: team2Stats.totalStats.doubles_frames_lost || 0,
      homeValueH: team1Stats.totalStats.home_doubles_frames_lost || 0,
      homeValueA: team1Stats.totalStats.away_doubles_frames_lost || 0,
      awayValueH: team2Stats.totalStats.home_doubles_frames_lost || 0,
      awayValueA: team2Stats.totalStats.away_doubles_frames_lost || 0,
    },
    {
      statName: 'Doubles Frame Win %',
      homeValue:
        team1Stats.totalStats.doubles_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.doubles_frames_won /
                team1Stats.totalStats.doubles_frames_played) *
                10000
            ) / 100,
      awayValue:
        team2Stats.totalStats.doubles_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.doubles_frames_won /
                team2Stats.totalStats.doubles_frames_played) *
                10000
            ) / 100,
      homeValueH:
        team1Stats.totalStats.home_doubles_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.home_doubles_frames_won /
                team1Stats.totalStats.home_doubles_frames_played) *
                10000
            ) / 100,
      homeValueA:
        team1Stats.totalStats.away_doubles_frames_played < 1
          ? 0
          : Math.round(
              (team1Stats.totalStats.away_doubles_frames_won /
                team1Stats.totalStats.away_doubles_frames_played) *
                10000
            ) / 100,
      awayValueH:
        team2Stats.totalStats.home_doubles_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.home_doubles_frames_won /
                team2Stats.totalStats.home_doubles_frames_played) *
                10000
            ) / 100,
      awayValueA:
        team2Stats.totalStats.away_doubles_frames_played < 1
          ? 0
          : Math.round(
              (team2Stats.totalStats.away_doubles_frames_won /
                team2Stats.totalStats.away_doubles_frames_played) *
                10000
            ) / 100,
      isPercentage: true,
    },
  ];

  const skillRows = [
    {
      statName: 'Lags Won',
      homeValue: team1Stats.totalStats.lags_won || 0,
      awayValue: team2Stats.totalStats.lags_won || 0,
      homeValueH: team1Stats.totalStats.home_lags_won || 0,
      homeValueA: team1Stats.totalStats.away_lags_won || 0,
      awayValueH: team2Stats.totalStats.home_lags_won || 0,
      awayValueA: team2Stats.totalStats.away_lags_won || 0,
    },
    {
      statName: 'Break Dishes',
      homeValue: team1Stats.totalStats.break_dishes || 0,
      awayValue: team2Stats.totalStats.break_dishes || 0,
      homeValueH: team1Stats.totalStats.home_break_dishes || 0,
      homeValueA: team1Stats.totalStats.away_break_dishes || 0,
      awayValueH: team2Stats.totalStats.home_break_dishes || 0,
      awayValueA: team2Stats.totalStats.away_break_dishes || 0,
    },
    {
      statName: 'Reverse Dishes',
      homeValue: team1Stats.totalStats.reverse_dishes || 0,
      awayValue: team2Stats.totalStats.reverse_dishes || 0,
      homeValueH: team1Stats.totalStats.home_reverse_dishes || 0,
      homeValueA: team1Stats.totalStats.away_reverse_dishes || 0,
      awayValueH: team2Stats.totalStats.home_reverse_dishes || 0,
      awayValueA: team2Stats.totalStats.away_reverse_dishes || 0,
    },
  ];

  const streakRows = [
    {
      statName: 'Current Match Win Streak',
      homeValue: team1Stats.totalStats.current_match_win_streak || 0,
      awayValue: team2Stats.totalStats.current_match_win_streak || 0,
    },
    {
      statName: 'Best Match Win Streak',
      homeValue: team1Stats.totalStats.best_match_win_streak || 0,
      awayValue: team2Stats.totalStats.best_match_win_streak || 0,
    },
    {
      statName: 'Current Frame Win Streak',
      homeValue: team1Stats.totalStats.current_frame_win_streak || 0,
      awayValue: team2Stats.totalStats.current_frame_win_streak || 0,
    },
    {
      statName: 'Best Frame Win Streak',
      homeValue: team1Stats.totalStats.best_frame_win_streak || 0,
      awayValue: team2Stats.totalStats.best_frame_win_streak || 0,
    },
  ];

  return (
    <View className="gap-2">
      <Heading text="Frames Stats" className="mt-4 text-text-on-brand" />
      <View className="rounded-3xl bg-bg-grouped-2 py-3">
        {/* Stat rows */}
        {framesRows.map((stat, index) => (
          <StatCardCompare
            key={index}
            homeTeam={team1Stats.teamMeta}
            awayTeam={team2Stats.teamMeta}
            stat={{
              statName: stat.statName,
              homeValue: stat[homeStat],
              awayValue: stat[awayStat],
              isPercentage: stat.isPercentage,
            }}
          />
        ))}
      </View>

      <Heading text="Match Stats" className="mt-4 text-text-on-brand" />
      <View className="rounded-3xl bg-bg-grouped-2 py-3">
        {/* Stat rows */}
        {matchRows.map((stat, index) => (
          <StatCardCompare
            key={index}
            homeTeam={team1Stats.teamMeta}
            awayTeam={team2Stats.teamMeta}
            stat={{
              statName: stat.statName,
              homeValue: stat[homeStat],
              awayValue: stat[awayStat],
              isPercentage: stat.isPercentage,
            }}
          />
        ))}
      </View>

      <Heading text="Frame Format Stats" className="mt-4 text-text-on-brand" />
      <View className="rounded-3xl bg-bg-grouped-2 py-3">
        {/* Stat rows */}
        {FrameFormatRows.map((stat, index) => (
          <StatCardCompare
            key={index}
            homeTeam={team1Stats.teamMeta}
            awayTeam={team2Stats.teamMeta}
            stat={{
              statName: stat.statName,
              homeValue: stat[homeStat],
              awayValue: stat[awayStat],
              isPercentage: stat.isPercentage,
            }}
          />
        ))}
      </View>

      <Heading text="Skill Stats" className="mt-4 text-text-on-brand" />
      <View className="rounded-3xl bg-bg-grouped-2 py-3">
        {skillRows.map((skill, index) => (
          <StatCardCompare
            key={index}
            homeTeam={team1Stats.teamMeta}
            awayTeam={team2Stats.teamMeta}
            stat={{
              statName: skill.statName,
              homeValue: skill[homeStat],
              awayValue: skill[awayStat],
            }}
          />
        ))}
      </View>

      {context === 'all' && (
        <>
          <Heading text="Streak Stats" className="mt-4 text-text-on-brand" />
          <View className="rounded-3xl bg-bg-grouped-2 py-3">
            {streakRows.map((streak, index) => (
              <StatCardCompare
                key={index}
                homeTeam={team1Stats.teamMeta}
                awayTeam={team2Stats.teamMeta}
                stat={{
                  statName: streak.statName,
                  homeValue: streak[homeStat],
                  awayValue: streak[awayStat],
                }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default CompareTeamStatsRows;
