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
  return (
    <View className="mb-4 w-full">
      <Text className="mb-2 font-saira-medium text-2xl text-text-2">{title}</Text>

      <View className={`relative h-16 w-full overflow-hidden rounded-xl bg-theme-${color}/20`}>
        {/* Filled Bar */}
        <View
          className={`absolute left-0 top-0 h-full bg-theme-${color}`}
          style={{
            width: `${width}`,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            borderTopRightRadius: value >= 99 ? 12 : 0,
            borderBottomRightRadius: value >= 99 ? 12 : 0,
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
          <Text className="font-saira-semibold text-xl text-text-2">{valueLabel}</Text>
          <Text className="font-saira-semibold text-xl text-text-2">{targetLabel}</Text>
        </View>
      )}
    </View>
  );
};

export default HorizontalStatBar;

const styles = StyleSheet.create({});
