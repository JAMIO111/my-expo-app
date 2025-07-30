import { StyleSheet, Text, View } from 'react-native';

const HorizontalStatBar = ({
  title,
  value,
  color = 'purple',
  type = 'percentage',
  target,
  valueLabel,
  targetLabel,
}) => {
  let width;
  if (type === 'number') {
    width = `${(value / target) * 100}%`;
  } else {
    width = `${value}%`;
  }
  let borderColor;
  let backgroundColor;
  let filledColor;
  switch (color) {
    case 'purple':
      borderColor = 'border-theme-purple';
      backgroundColor = 'bg-theme-purple/40';
      filledColor = 'bg-theme-purple';
      break;
    case 'orange':
      borderColor = 'border-theme-orange';
      backgroundColor = 'bg-theme-orange/40';
      filledColor = 'bg-theme-orange';
      break;
    case 'blue':
      borderColor = 'border-theme-blue';
      backgroundColor = 'bg-theme-blue/40';
      filledColor = 'bg-theme-blue';
      break;

    default:
      break;
  }

  return (
    <View className="mb-4 w-full">
      <Text className="mb-1 font-saira-semibold text-xl text-text-2">{title}</Text>

      <View
        className={`relative h-16 w-full overflow-hidden rounded-xl border ${backgroundColor} ${borderColor}`}>
        {/* Filled Bar */}
        <View
          className={`absolute left-0 top-0 h-full ${filledColor}`}
          style={{
            width: `${width}`,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            borderTopRightRadius: value >= 99 ? 8 : 0,
            borderBottomRightRadius: value >= 99 ? 8 : 0,
          }}
        />

        {/* Centered Text */}
        <View className="absolute inset-0 items-end justify-center pr-3">
          <Text className="font-saira-semibold text-2xl text-white">
            {type === 'percentage' ? `${value}%` : target}
          </Text>
        </View>
        {type === 'number' && (
          <View className="absolute inset-0 items-start justify-center pl-3">
            <Text className="font-saira-semibold text-2xl text-white">{value}</Text>
          </View>
        )}
      </View>
      {(valueLabel || targetLabel) && (
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="font-saira-medium text-xl text-text-2">{valueLabel}</Text>
          <Text className="font-saira-medium text-xl text-text-2">{targetLabel}</Text>
        </View>
      )}
    </View>
  );
};

export default HorizontalStatBar;

const styles = StyleSheet.create({});
