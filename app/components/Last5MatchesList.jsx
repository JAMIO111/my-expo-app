import { View, Text } from 'react-native';
import TeamLogo from './TeamLogo';

const Last5MatchesList = ({ matches = [] }) => {
  const safeMatches = (matches ?? []).filter(Boolean);

  return (
    <View className="gap-2">
      {safeMatches.length > 0 ? (
        safeMatches.map((match, index) => (
          <View className="gap-2 rounded-2xl bg-bg-2 p-4 py-2" key={index}>
            <View className="mb-1 border-b border-theme-gray-5 pb-2">
              <Text className="text-md font-saira-medium text-text-1">
                {new Date(match?.date_time).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View className="flex-row items-center justify-start gap-2">
              <View className="flex-1 flex-row items-center justify-start gap-2">
                <TeamLogo
                  size={20}
                  color1={match?.home_competitor.image?.color1}
                  color2={match?.home_competitor.image?.color2}
                  type={match?.home_competitor.image?.type}
                  thickness={match?.home_competitor.image?.thickness}
                />
                <Text className="font-saira-medium text-text-2">
                  {match?.home_competitor.abbreviation}
                </Text>
                <Text className="font-saira-medium text-text-1">{match?.home_competitor.name}</Text>
              </View>
              <Text className="min-w-6 text-center font-saira-medium text-xl text-text-1">
                {match?.home_score}
              </Text>
            </View>
            <View className="flex-row items-center justify-start gap-2">
              <View className="flex-1 flex-row items-center justify-start gap-2">
                <TeamLogo
                  size={20}
                  color1={match?.away_competitor.image?.color1}
                  color2={match?.away_competitor.image?.color2}
                  type={match?.away_competitor.image?.type}
                  thickness={match?.away_competitor.image?.thickness}
                />
                <Text className="font-saira-medium text-text-2">
                  {match?.away_competitor.abbreviation}
                </Text>
                <Text className="font-saira-medium text-text-1">{match?.away_competitor.name}</Text>
              </View>
              <Text className="min-w-6 text-center font-saira-medium text-xl text-text-1">
                {match?.away_score}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View className="items-center justify-center rounded-2xl bg-bg-2 py-8">
          <Text className="font-saira text-text-2">No recent matches available.</Text>
        </View>
      )}
    </View>
  );
};

export default Last5MatchesList;
