import { Text, View } from 'react-native';
import { useLast5Results } from '@hooks/useLast5Results'; // adjust import as needed

const getColor = (result) => {
  switch (result) {
    case 'W':
      return 'bg-theme-green';
    case 'D':
      return 'bg-theme-yellow';
    case 'L':
      return 'bg-theme-red';
    default:
      return 'bg-gray-400';
  }
};

const FormWidget = ({ homeTeamId, awayTeamId }) => {
  // Fetch form for both teams
  const { data: homeForm, isLoading: loadingHome } = useLast5Results(homeTeamId);
  const { data: awayForm, isLoading: loadingAway } = useLast5Results(awayTeamId);

  const getFormStreak = (form) => {
    if (!form || form.length === 0) return 'No recent form';

    const first = form[0];
    let streakCount = 1;

    for (let i = 1; i < form.length; i++) {
      if (form[i] === first) {
        streakCount++;
      } else {
        break;
      }
    }

    if (first === 'W') {
      return `${streakCount} win streak`;
    } else if (first === 'L') {
      return `${streakCount} loss streak`;
    } else if (first === 'D') {
      return `${streakCount} draw streak`;
    }

    return 'No recent streak';
  };

  if (loadingHome || loadingAway) {
    return (
      <View className="p-4">
        <Text className="text-center text-text-2">Loading form data...</Text>
      </View>
    );
  }

  return (
    <View className="gap-3 bg-bg-grouped-2 px-2 py-3">
      <View className="flex-row items-center justify-between px-2">
        <Text className="flex-1 text-left font-saira text-lg font-semibold text-text-1">
          {getFormStreak(homeForm)}
        </Text>
        <Text className="w-26 text-center font-saira text-lg font-medium text-text-2">
          Recent Form
        </Text>
        <Text className="flex-1 text-right font-saira text-lg font-semibold text-text-1">
          {getFormStreak(awayForm)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between px-2">
        <View className="flex-row items-center gap-2">
          {homeForm?.map((result, index) => (
            <View
              key={`home-${index}`}
              className={`h-6 w-6 items-center justify-center rounded-full ${getColor(result)}`}>
              <Text
                className={`${
                  result === 'L' ? 'text-white' : 'text-black'
                } text-center font-saira-medium`}>
                {result}
              </Text>
            </View>
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          {awayForm?.map((result, index) => (
            <View
              key={`away-${index}`}
              className={`h-6 w-6 items-center justify-center rounded-full ${getColor(result)}`}>
              <Text
                className={`${
                  result === 'L' ? 'text-white' : 'text-black'
                } text-center font-saira-medium`}>
                {result}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default FormWidget;
