import { View, Text } from 'react-native';
import TeamLogo from './TeamLogo';

const Last5MatchesList = ({ matches = [] }) => {
  const safeMatches = (matches ?? []).filter(Boolean);

  return (
    <View className="gap-2">
      {safeMatches.length > 0 ? (
        safeMatches.map((match, index) => (
          <View className="gap-2 rounded-2xl bg-bg-2 p-4" key={index}>
            <View className="mb-1 border-b border-theme-gray-5 pb-2">
              <Text className="font-saira-medium text-sm text-text-1">
                {new Date(match?.date_time).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View className="flex-row items-center justify-start gap-2">
              <View className="flex-1 flex-row items-center justify-start gap-2">
                <TeamLogo
                  size={20}
                  color1={match?.home.crest?.color1}
                  color2={match?.home.crest?.color2}
                  type={match?.home.crest?.type}
                  thickness={match?.home.crest?.thickness}
                />
                <Text className="font-saira-medium text-text-2">{match?.home.abbreviation}</Text>
                <Text className="font-saira-medium text-text-2">{match?.home.name}</Text>
              </View>
              <Text className="font-saira-medium text-xl text-text-1">{match?.home.score}</Text>
            </View>
            <View className="flex-row items-center justify-start gap-2">
              <View className="flex-1 flex-row items-center justify-start gap-2">
                <TeamLogo
                  size={20}
                  color1={match?.away.crest?.color1}
                  color2={match?.away.crest?.color2}
                  type={match?.away.crest?.type}
                  thickness={match?.away.crest?.thickness}
                />
                <Text className="font-saira-medium text-text-2">{match?.away.abbreviation}</Text>
                <Text className="font-saira-medium text-text-2">{match?.away.name}</Text>
              </View>
              <Text className="font-saira-medium text-xl text-text-1">{match?.away.score}</Text>
            </View>
          </View>
        ))
      ) : (
        <View className="items-center justify-center rounded-2xl bg-bg-2 py-8">
          <Text className="text-text-2">No recent matches available.</Text>
        </View>
      )}
    </View>
  );
};

export default Last5MatchesList;
