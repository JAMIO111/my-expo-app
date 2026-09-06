import { View, Text, Pressable } from 'react-native';

export default function ChipSelector({
  options = [],
  value,
  onChange,
  multi = false,
  contentContainerClassName = '',
}) {
  const isSelected = (optionValue) =>
    multi ? Array.isArray(value) && value.includes(optionValue) : value === optionValue;

  const handlePress = (optionValue) => {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      onChange?.(next);
    } else {
      onChange?.(optionValue);
    }
  };

  return (
    <View className={`w-full flex-row flex-wrap gap-3 px-2 py-1 ${contentContainerClassName}`}>
      {options.map((option) => {
        const selected = isSelected(option.value);

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => handlePress(option.value)}
            style={{ flexGrow: 1, flexBasis: 'auto', flexShrink: 0 }}
            className={`flex-row items-center justify-center rounded-full border px-4 py-1.5 ${
              selected ? 'border-brand bg-brand' : 'border-theme-gray-4 bg-bg-1'
            }`}>
            {option.icon ? (
              <View className="mr-2">
                {selected && option.selectedIcon ? option.selectedIcon : option.icon}
              </View>
            ) : null}
            <Text
              numberOfLines={1}
              style={{ paddingTop: 2 }}
              className={`font-saira-semibold text-sm ${selected ? 'text-white' : 'text-text-2'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
