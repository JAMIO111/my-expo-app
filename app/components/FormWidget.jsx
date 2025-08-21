import { Text, View } from 'react-native';
import { useLast5Results } from '@hooks/useLast5Results'; // adjust import as needed
import Ionicons from 'react-native-vector-icons/Ionicons';

const getColor = (result) => {
  switch (result) {
    case 'W':
      return 'bg-theme-green';
    case 'D':
      return 'bg-theme-gray-1';
    case 'L':
      return 'bg-theme-red';
    default: // for '-'
      return 'bg-theme-gray-1';
  }
};

const FormCircle = ({ result }) => {
  const isEmpty = result === '-';
  return (
    <View
      style={{ padding: 2 }}
      className={`${result === 'L' ? 'border-2 border-theme-red' : result === 'W' ? 'border-2 border-theme-green' : result === 'D' ? 'border-2 border-theme-gray-1' : ''} items-center justify-center rounded-full`}>
      <View className={`h-6 w-6 items-center justify-center rounded-full ${getColor(result)}`}>
        {!isEmpty ? (
          <Ionicons
            name={result === 'W' ? 'checkmark' : result === 'L' ? 'close' : 'remove'}
            size={16}
            color="white"
          />
        ) : (
          <View className="h-4 w-4 rounded-full bg-bg-grouped-2" />
        )}
      </View>
    </View>
  );
};

const FormWidget = ({ homeTeamId, awayTeamId }) => {
  const { data: homeForm, isLoading: loadingHome } = useLast5Results(homeTeamId);
  const { data: awayForm, isLoading: loadingAway } = useLast5Results(awayTeamId);
  console.log('Home Form:', homeForm);
  console.log('Away Form:', awayForm);

  const getFormStreak = (form) => {
    if (!form || form.length === 0) return 'No recent form';

    const first = form[0];
    if (first === '-') return 'No recent form';

    let streakCount = 1;
    for (let i = 1; i < form.length; i++) {
      if (form[i] === first) {
        streakCount++;
      } else {
        break;
      }
    }

    if (first === 'W') return `${streakCount} win streak`;
    if (first === 'L') return `${streakCount} loss streak`;
    if (first === 'D') return `${streakCount} draw streak`;

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
          {[...(homeForm ?? [])].reverse().map((result, index) => (
            <FormCircle key={`home-${index}`} result={result} />
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          {(awayForm ?? []).map((result, index) => (
            <FormCircle key={`away-${index}`} result={result} />
          ))}
        </View>
      </View>
    </View>
  );
};

export default FormWidget;
