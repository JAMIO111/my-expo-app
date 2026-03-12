import { forwardRef } from 'react';
import { View, Text, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const CustomDatePicker = forwardRef((props, ref) => {
  const {
    value,
    onChange,
    titleColor = 'text-text-on-brand',
    placeholder,
    title,
    leftIconName,
    leftIconSize = 24,
    iconColor = '#9CA3AF',
  } = props;
  return (
    <View>
      <Text className={`pb-1 pl-2 font-saira-medium text-xl ${titleColor}`}>{title}</Text>
      <View className="h-14 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background pr-3">
        <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
          <Ionicons name={leftIconName} size={leftIconSize} color={iconColor} />
        </View>
        {value ? (
          <Text className="flex-1 py-1 pl-3 font-saira text-xl text-text-1">
            {new Date(value).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        ) : (
          <Text className="flex-1 py-1 pl-3 font-saira text-xl text-text-1">{placeholder}</Text>
        )}
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          minimumDate={new Date(2000, 0, 1)}
          maximumDate={new Date(2100, 11, 31)}
          display="default"
          onChange={(event, selectedDate) =>
            onChange(selectedDate ? selectedDate.toISOString().split('T')[0] : value)
          }
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
});
export default CustomDatePicker;
