import { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroupedFixtures } from '@hooks/useGroupedFixtures';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const FixturesAccordion = ({ season, competitionInstance, isExpanded, onPress }) => {
  const [expandedDate, setExpandedDate] = useState(null); // inner date toggle

  console.log(
    'FixturesAccordion Props - season:',
    season,
    'competitionInstance:',
    competitionInstance
  );

  const { data: fixturesGrouped, isLoading } = useGroupedFixtures({
    month: null,
    seasonId: season?.id,
    competitionInstanceId: competitionInstance?.id,
  });

  console.log('FixturesAccordion - grouped fixtures:', fixturesGrouped);

  const toggleDate = (date) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  const hasFixtures = fixturesGrouped && Object.keys(fixturesGrouped).length > 0;

  return (
    <View className="w-full rounded-2xl bg-bg-2 shadow-sm">
      {/* Top-level header */}
      <Pressable
        onPress={hasFixtures ? onPress : null} // external control
        className="flex-row items-center justify-between p-4">
        <View>
          <Text className="font-saira-semibold text-xl text-text-1">{season?.name} Fixtures</Text>
          {!isExpanded && (
            <Text className="font-saira-medium text-text-2">
              {Object.keys(fixturesGrouped || {}).length} matchday
              {Object.keys(fixturesGrouped || {}).length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {hasFixtures && (
          <Ionicons
            name="chevron-down"
            size={22}
            color="gray"
            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
          />
        )}
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View className="gap-2 border-t border-theme-gray-5 p-3">
          {isLoading ? (
            <Text className="text-text-2">Loading fixtures...</Text>
          ) : (
            Object.entries(fixturesGrouped || {}).map(([date, fixturesForDate]) => (
              <View key={date} className="rounded-2xl bg-bg-1 shadow-sm">
                {/* Date header */}
                <Pressable
                  onPress={() => toggleDate(date)}
                  className="flex-row items-center justify-between p-4">
                  <Text className="font-saira-medium text-lg text-text-1">
                    {new Date(date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </Text>
                  <Text className="flex flex-1 px-5 text-right font-saira text-text-2">
                    {fixturesForDate.length} Fixture{fixturesForDate.length !== 1 ? 's' : ''}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={22}
                    color="gray"
                    style={{ transform: [{ rotate: expandedDate === date ? '180deg' : '0deg' }] }}
                  />
                </Pressable>

                {/* Fixtures for this date */}
                {expandedDate === date && (
                  <View className="gap-2 p-3">
                    {fixturesForDate.map((fixture) => (
                      <View
                        key={fixture.id}
                        className="flex flex-1 flex-col items-center justify-between gap-2 rounded-2xl bg-bg-2 p-2 shadow-sm">
                        <View className="flex flex-row items-center justify-between gap-2">
                          <View className="flex-1 flex-col items-center justify-between gap-2">
                            <View className="flex-1 flex-row items-center justify-between gap-2">
                              {fixture?.competitor_type === 'team' ? (
                                <TeamLogo
                                  size={20}
                                  type={fixture?.home_team?.crest?.type}
                                  color1={fixture?.home_team?.crest?.color1}
                                  color2={fixture?.home_team?.crest?.color2}
                                  thickness={fixture?.home_team?.crest?.thickness}
                                />
                              ) : (
                                <Avatar size={20} borderRadius={10} player={fixture?.home_player} />
                              )}
                              <Text className="font-saira-semibold text-lg text-text-1">
                                {fixture?.competitor_type === 'team'
                                  ? fixture?.home_team?.abbreviation || 'Home Team'
                                  : `(${fixture?.home_player?.nickname})` || 'Home Player'}
                              </Text>
                              <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                className={`flex-1 text-left font-saira text-lg text-text-2`}>
                                {fixture?.competitor_type === 'team'
                                  ? fixture?.home_team?.display_name || 'Home Team'
                                  : `${fixture?.home_player?.first_name || 'Home'} ${fixture?.home_player?.surname || 'Player'}`}
                              </Text>
                            </View>
                            <View className="flex-1 flex-row items-center justify-between gap-2">
                              {fixture?.competitor_type === 'team' ? (
                                <TeamLogo
                                  size={20}
                                  type={fixture?.away_team?.crest?.type}
                                  color1={fixture?.away_team?.crest?.color1}
                                  color2={fixture?.away_team?.crest?.color2}
                                  thickness={fixture?.away_team?.crest?.thickness}
                                />
                              ) : (
                                <Avatar size={20} borderRadius={10} player={fixture?.away_player} />
                              )}
                              <Text className="font-saira-semibold text-lg text-text-1">
                                {fixture?.competitor_type === 'team'
                                  ? fixture?.away_team?.abbreviation || 'Away Team'
                                  : `(${fixture?.away_player?.nickname})` || 'Away Player'}
                              </Text>
                              <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                className={`flex-1 text-left font-saira text-lg text-text-2`}>
                                {fixture?.competitor_type === 'team'
                                  ? fixture?.away_team?.display_name || 'Away Team'
                                  : `${fixture?.away_player?.first_name || 'Away'} ${fixture?.away_player?.surname || 'Player'}`}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-row items-center justify-end gap-2">
                            <Text className="font-saira-medium text-lg text-text-2">
                              {new Date(fixture.date_time).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

export default FixturesAccordion;
