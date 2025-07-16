import { Text, View } from 'react-native';

const form = {
  homeTeam: ['W', 'W', 'L', 'L', 'W'],
  awayTeam: ['L', 'L', 'L', 'L', 'W'],
};

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

const FormWidget = () => {
  function getFormStreak(form) {
    if (!form || form.length === 0) return 'No recent games';

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
  }

  return (
    <View className="gap-3 bg-bg-grouped-2 px-2 py-3">
      <View className="flex-row items-center justify-between px-2">
        <Text className="flex-1 text-left font-saira text-lg font-semibold text-text-1">
          {getFormStreak(form?.homeTeam)}
        </Text>
        <Text className="w-26 text-center font-saira text-lg font-medium text-text-2">
          Recent Form
        </Text>
        <Text className="flex-1 text-right font-saira text-lg font-semibold text-text-1">
          {getFormStreak(form?.awayTeam)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between px-2">
        <View className="flex-row items-center gap-2">
          {form.homeTeam.map((result, index) => (
            <View
              key={`home-${index}`}
              className={`h-6 w-6 items-center justify-center rounded-full ${getColor(result)}`}
            />
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          {form.awayTeam.map((result, index) => (
            <View key={`away-${index}`} className={`h-6 w-6 rounded-full ${getColor(result)}`} />
          ))}
        </View>
      </View>
    </View>
  );
};

export default FormWidget;
