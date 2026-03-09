import { Text, Pressable, View } from 'react-native';
import { useRef } from 'react';
import { Animated, Easing } from 'react-native';
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
      <View className={`h-5 w-5 items-center justify-center rounded-full ${getColor(result)}`}>
        {!isEmpty ? (
          <Ionicons
            name={result === 'W' ? 'checkmark' : result === 'L' ? 'close' : 'remove'}
            size={16}
            color="white"
          />
        ) : (
          <View className="h-3 w-3 rounded-full bg-bg-grouped-2" />
        )}
      </View>
    </View>
  );
};

const normalizeForm = (form) => {
  const maxLength = 5;
  if (!form || form.length === 0) return Array(maxLength).fill('-');

  // ensure length is exactly 5
  const filled = [...form];
  while (filled.length < maxLength) {
    filled.push('-');
  }
  return filled.slice(0, maxLength);
};

const FormWidget = ({
  homeCompetitorId,
  awayCompetitorId,
  competitorType,
  formType = 'matches',
  onFormTypeChange,
}) => {
  const { data: homeFormRaw, isLoading: loadingHome } = useLast5Results(
    homeCompetitorId,
    competitorType,
    formType
  );
  const { data: awayFormRaw, isLoading: loadingAway } = useLast5Results(
    awayCompetitorId,
    competitorType,
    formType
  );

  const spinValue = useRef(new Animated.Value(0)).current;

  console.log('Home Form Raw:', homeFormRaw);
  console.log('Away Form Raw:', awayFormRaw);

  const homeForm = normalizeForm(homeFormRaw?.form);
  const awayForm = normalizeForm(awayFormRaw?.form);

  console.log('Home Form:', homeForm);
  console.log('Away Form:', awayForm);

  const handlePress = () => {
    onFormTypeChange(formType === 'matches' ? 'frames' : 'matches');
    // Purely trigger the animation
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 600, // Slightly faster for a "snappy" feel
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
    <Pressable onPress={handlePress} pointerEvents="box-none">
      <View className="h-28 gap-4 rounded-3xl bg-bg-1 px-2 py-3">
        <View className="flex-row items-center justify-between px-2">
          <Text className="text-md flex-1 text-left font-saira font-semibold text-text-1">
            {getFormStreak(homeForm)}
          </Text>
          <Text className="w-26 text-md text-center font-saira font-medium text-text-2">
            Recent {formType === 'matches' ? 'Match' : 'Frame'} Form
          </Text>
          <Text className="text-md flex-1 text-right font-saira font-semibold text-text-1">
            {getFormStreak(awayForm)}
          </Text>
        </View>

        <View className="flex-1 flex-row items-center justify-between px-2">
          <View className="flex-1 flex-row items-center gap-1">
            {[...(homeForm ?? [])].reverse().map((result, index) => (
              <FormCircle key={`home-${index}`} result={result} />
            ))}
          </View>
          <View className="mx-2">
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="sync-circle" size={32} color="#6B7280" />
            </Animated.View>
          </View>
          <View className="flex-1 flex-row items-center justify-end gap-1">
            {(awayForm ?? []).map((result, index) => (
              <FormCircle key={`away-${index}`} result={result} />
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default FormWidget;
